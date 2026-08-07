// Prices unpriced bounties in USD and refreshes platform_stats.
// Trigger: pg_cron daily, or manual POST.
//
// Strategy:
// 1. Parse `compensation` text into { amount, symbol }.
// 2. Stablecoins -> $1.
// 3. Known tickers -> CoinGecko simple/price (no key), Moralis fallback for SOL.
// 4. Unknown / non-numeric -> skip (compensation_amount_usd stays null).
// 5. Update platform_stats('global').

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { fetchSolPriceUsd } from "../_shared/sol-price.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STABLES: Record<string, number> = {
  USDC: 1, USDT: 1, USDG: 1, DAI: 1, USDP: 1, PYUSD: 1, BUSD: 1, FDUSD: 1, USD: 1,
};

// CoinGecko id map for common tickers seen in bounties
const CG_IDS: Record<string, string> = {
  SOL: "solana",
  ETH: "ethereum",
  BTC: "bitcoin",
  MATIC: "matic-network",
  POL: "polygon-ecosystem-token",
  BNB: "binancecoin",
  AVAX: "avalanche-2",
  ARB: "arbitrum",
  OP: "optimism",
  SUI: "sui",
  APT: "aptos",
  JUP: "jupiter-exchange-solana",
  BONK: "bonk",
  JTO: "jito-governance-token",
  WIF: "dogwifcoin",
  PYTH: "pyth-network",
  RNDR: "render-token",
  TIA: "celestia",
};

// Skip these — they're not actual tokens
const SKIP_SYMBOLS = new Set(["EVM", "NFT", "POINTS", "POINT", "TICKETS", "TICKET", "XP"]);

function parseCompensation(raw: string): { amount: number; symbol: string } | null {
  if (!raw) return null;
  const s = raw.trim();
  // $5 / $1,000
  const dollar = s.match(/^\$\s*([\d,]+(?:\.\d+)?)/);
  if (dollar) return { amount: parseFloat(dollar[1].replace(/,/g, "")), symbol: "USD" };
  // "500 USDC", "1,500 USDG", "0.5 SOL"
  const m = s.match(/([\d,]+(?:\.\d+)?)\s*([A-Za-z]{2,10})/);
  if (!m) return null;
  const amount = parseFloat(m[1].replace(/,/g, ""));
  if (!isFinite(amount) || amount <= 0) return null;
  const symbol = m[2].toUpperCase();
  return { amount, symbol };
}

async function cgPrice(id: string): Promise<number | null> {
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
    if (!r.ok) return null;
    const j = await r.json();
    const p = j?.[id]?.usd;
    return typeof p === "number" ? p : null;
  } catch { return null; }
}

async function priceFor(symbol: string, cache: Map<string, number>): Promise<{ price: number; source: string } | null> {
  if (STABLES[symbol] !== undefined) return { price: STABLES[symbol], source: "stable" };
  if (SKIP_SYMBOLS.has(symbol)) return null;
  if (cache.has(symbol)) return { price: cache.get(symbol)!, source: "cache" };

  if (symbol === "SOL") {
    try {
      const r = await fetchSolPriceUsd("[price-bounties]");
      cache.set(symbol, r.price);
      return { price: r.price, source: "sol-shared" };
    } catch { /* fall through */ }
  }

  const id = CG_IDS[symbol];
  if (id) {
    const p = await cgPrice(id);
    if (p) { cache.set(symbol, p); return { price: p, source: "coingecko" }; }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Pull rows that don't yet have a USD price computed.
  const { data: rows, error } = await supabase
    .from("tasks")
    .select("id, compensation")
    .is("compensation_amount_usd", null)
    .not("compensation", "is", null)
    .limit(500);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cache = new Map<string, number>();
  let priced = 0, skipped = 0;
  for (const row of rows ?? []) {
    const parsed = parseCompensation(row.compensation as string);
    if (!parsed) { skipped++; continue; }
    const p = await priceFor(parsed.symbol, cache);
    if (!p) { skipped++; continue; }
    const usd = parsed.amount * p.price;
    await supabase.from("tasks").update({
      compensation_amount_usd: usd,
      compensation_priced_at: new Date().toISOString(),
      compensation_price_source: `${p.source}:${parsed.symbol}`,
    }).eq("id", row.id);
    priced++;
  }

  // Refresh aggregate stats
  const { count: totalBounties } = await supabase
    .from("tasks").select("*", { count: "exact", head: true });
  const { data: agg } = await supabase
    .from("tasks")
    .select("compensation_amount_usd")
    .not("compensation_amount_usd", "is", null);
  const totalValueUsd = (agg ?? []).reduce(
    (s: number, r: any) => s + Number(r.compensation_amount_usd ?? 0), 0);
  const pricedCount = (agg ?? []).length;

  const { data: prev } = await supabase
    .from("platform_stats")
    .select("lifetime_bounties, lifetime_value_usd")
    .eq("id", "global")
    .maybeSingle();

  const lifetimeBounties = Math.max(prev?.lifetime_bounties ?? 0, totalBounties ?? 0);
  const lifetimeValueUsd = Math.max(Number(prev?.lifetime_value_usd ?? 0), totalValueUsd);

  await supabase.from("platform_stats").upsert({
    id: "global",
    total_bounties: totalBounties ?? 0,
    total_value_usd: totalValueUsd,
    priced_count: pricedCount,
    lifetime_bounties: lifetimeBounties,
    lifetime_value_usd: lifetimeValueUsd,
    updated_at: new Date().toISOString(),
  });


  return new Response(JSON.stringify({
    priced, skipped,
    total_bounties: totalBounties, total_value_usd: totalValueUsd, priced_count: pricedCount,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
