// Helius provider — Solana raw blockchain data.
// Fetches enriched transaction history and normalizes it into NormalizedSignals.
// Fails soft: returns { ok: false } on any error / missing key.
//
// Providers only supply raw blockchain events. All behavioural scoring
// happens inside the Diamonds engine.

import type { NormalizedSignals } from "../types.ts";

const HELIUS_BASE = "https://api.helius.xyz";

const PROTOCOL_HINTS: Record<string, string> = {
  jupiter: "Jupiter",
  raydium: "Raydium",
  orca: "Orca",
  phoenix: "Phoenix",
  meteora: "Meteora",
  lifinity: "Lifinity",
  marinade: "Marinade",
  jito: "Jito",
  kamino: "Kamino",
  drift: "Drift",
  mango: "Mango",
  solend: "Solend",
  tensor: "Tensor",
  magiceden: "Magic Eden",
  pumpfun: "Pump.fun",
};

function empty(ok = false): NormalizedSignals {
  return {
    account_age_days: null,
    first_activity_at: null,
    last_activity_at: null,
    transaction_count: null,
    swap_count: null,
    token_count: null,
    nft_count: null,
    unique_protocols: [],
    unique_nft_collections: [],
    avg_hold_days: null,
    churn_rate: null,
    fast_sell_ratio: null,
    reputation_signal: null,
    risk_signal: null,
    sybil_signal: null,
    provider: "helius",
    ok,
  };
}

export async function fetchHeliusSignals(address: string): Promise<NormalizedSignals> {
  const apiKey = Deno.env.get("HELIUS_API_KEY");
  if (!apiKey) {
    console.log("[diamonds/helius] HELIUS_API_KEY not configured — skipping");
    return empty();
  }
  // EVM addresses are 0x-prefixed; skip.
  if (address.startsWith("0x")) return empty();

  try {
    const url = `${HELIUS_BASE}/v0/addresses/${encodeURIComponent(address)}/transactions?api-key=${apiKey}&limit=100`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[diamonds/helius] HTTP ${res.status}`);
      return empty();
    }
    const rows: any[] = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return empty();

    const timestamps: number[] = [];
    const protocols = new Set<string>();
    let swapCount = 0;

    for (const tx of rows) {
      const ts = tx?.timestamp;
      if (typeof ts === "number") timestamps.push(ts * 1000);
      const blob = JSON.stringify(tx?.source ?? tx?.type ?? "").toLowerCase();
      for (const [key, label] of Object.entries(PROTOCOL_HINTS)) {
        if (blob.includes(key)) protocols.add(label);
      }
      const type = String(tx?.type ?? "").toUpperCase();
      if (type.includes("SWAP")) swapCount++;
    }

    timestamps.sort((a, b) => a - b);
    const firstMs = timestamps[0];
    const lastMs = timestamps[timestamps.length - 1];
    const first = firstMs ? new Date(firstMs).toISOString() : null;
    const last = lastMs ? new Date(lastMs).toISOString() : null;
    const ageDays = firstMs ? Math.max(0, Math.floor((Date.now() - firstMs) / 86_400_000)) : null;

    const out = empty(true);
    out.account_age_days = ageDays;
    out.first_activity_at = first;
    out.last_activity_at = last;
    out.transaction_count = rows.length;
    out.swap_count = swapCount || null;
    out.unique_protocols = [...protocols];
    return out;
  } catch (err) {
    console.warn("[diamonds/helius] error:", (err as Error).message);
    return empty();
  }
}
