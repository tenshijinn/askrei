// Alchemy provider — EVM raw blockchain data (asset transfers, token balances).
// Fails soft when ALCHEMY_API_KEY isn't configured or the address isn't EVM.

import type { NormalizedSignals } from "../types.ts";

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
    provider: "alchemy",
    ok,
  };
}

export async function fetchAlchemySignals(address: string): Promise<NormalizedSignals> {
  const apiKey = Deno.env.get("ALCHEMY_API_KEY");
  if (!apiKey) return empty();
  if (!address.startsWith("0x")) return empty();

  try {
    const url = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getAssetTransfers",
      params: [{
        fromAddress: address,
        category: ["external", "erc20", "erc721", "erc1155"],
        maxCount: "0x64",
        withMetadata: true,
      }],
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return empty();
    const json = await res.json();
    const transfers: any[] = json?.result?.transfers ?? [];
    if (transfers.length === 0) return empty();

    const timestamps = transfers
      .map((t) => Date.parse(t?.metadata?.blockTimestamp ?? ""))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
    const firstMs = timestamps[0];
    const lastMs = timestamps[timestamps.length - 1];
    const out = empty(true);
    out.transaction_count = transfers.length;
    out.first_activity_at = firstMs ? new Date(firstMs).toISOString() : null;
    out.last_activity_at = lastMs ? new Date(lastMs).toISOString() : null;
    out.account_age_days = firstMs
      ? Math.max(0, Math.floor((Date.now() - firstMs) / 86_400_000))
      : null;
    return out;
  } catch (err) {
    console.warn("[diamonds/alchemy] error:", (err as Error).message);
    return empty();
  }
}
