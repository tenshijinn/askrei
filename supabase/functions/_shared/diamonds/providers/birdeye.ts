// Birdeye provider — Solana token portfolio & trade history.
// Fails soft when BIRDEYE_API_KEY isn't configured. Providers only supply
// raw blockchain data; scoring happens in the Diamonds engine.

import type { NormalizedSignals } from "../types.ts";

const BIRDEYE_BASE = "https://public-api.birdeye.so";

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
    provider: "birdeye",
    ok,
  };
}

export async function fetchBirdeyeSignals(address: string): Promise<NormalizedSignals> {
  const apiKey = Deno.env.get("BIRDEYE_API_KEY");
  if (!apiKey) return empty();
  if (address.startsWith("0x")) return empty();

  try {
    const res = await fetch(
      `${BIRDEYE_BASE}/v1/wallet/token_list?wallet=${encodeURIComponent(address)}`,
      { headers: { "X-API-KEY": apiKey, "x-chain": "solana" } },
    );
    if (!res.ok) return empty();
    const json = await res.json();
    const items: any[] = json?.data?.items ?? [];
    if (items.length === 0) return empty();
    const out = empty(true);
    out.token_count = items.length;
    return out;
  } catch (err) {
    console.warn("[diamonds/birdeye] error:", (err as Error).message);
    return empty();
  }
}
