// Blockscout provider — public EVM raw data. No API key required.
// Fails soft on any error or non-EVM address.

import type { NormalizedSignals } from "../types.ts";

const BLOCKSCOUT_BASE = "https://eth.blockscout.com";

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
    provider: "blockscout",
    ok,
  };
}

export async function fetchBlockscoutSignals(address: string): Promise<NormalizedSignals> {
  if (!address.startsWith("0x")) return empty();
  try {
    const res = await fetch(
      `${BLOCKSCOUT_BASE}/api/v2/addresses/${encodeURIComponent(address)}/transactions?filter=to%20%7C%20from`,
    );
    if (!res.ok) return empty();
    const json = await res.json();
    const items: any[] = json?.items ?? [];
    if (items.length === 0) return empty();
    const timestamps = items
      .map((t) => Date.parse(t?.timestamp ?? ""))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
    const firstMs = timestamps[0];
    const lastMs = timestamps[timestamps.length - 1];
    const out = empty(true);
    out.transaction_count = items.length;
    out.first_activity_at = firstMs ? new Date(firstMs).toISOString() : null;
    out.last_activity_at = lastMs ? new Date(lastMs).toISOString() : null;
    out.account_age_days = firstMs
      ? Math.max(0, Math.floor((Date.now() - firstMs) / 86_400_000))
      : null;
    return out;
  } catch (err) {
    console.warn("[diamonds/blockscout] error:", (err as Error).message);
    return empty();
  }
}
