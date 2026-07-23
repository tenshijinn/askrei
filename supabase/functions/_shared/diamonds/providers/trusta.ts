// Trusta AI provider — reputation / sybil signals for a wallet address.
// Fails soft: any error or missing key returns an "ok: false" signal bundle
// so the engine can still produce a Diamond Score from Moralis alone.
// Raw Trusta fields are NEVER returned — only opaque normalized 0..1 signals.

import type { NormalizedSignals } from "../types.ts";

const TRUSTA_BASE = "https://api.trustalabs.ai";

function clamp01(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n > 1 && n <= 100) return Math.max(0, Math.min(1, n / 100));
  return Math.max(0, Math.min(1, n));
}

export async function fetchTrustaSignals(address: string): Promise<NormalizedSignals> {
  const apiKey = Deno.env.get("TRUSTA_API_KEY");
  const empty: NormalizedSignals = {
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
    provider: "trusta",
    ok: false,
  };

  if (!apiKey) {
    console.log("[diamonds/trusta] TRUSTA_API_KEY not configured — skipping");
    return empty;
  }

  try {
    // TrustGo MEDIA / reputation endpoint. Exact path may vary by tenant;
    // we treat any 2xx JSON as authoritative and normalize opaquely.
    const url = `${TRUSTA_BASE}/media/score?address=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[diamonds/trusta] HTTP ${res.status}`);
      return empty;
    }
    const data = await res.json().catch(() => null);
    if (!data || typeof data !== "object") return empty;

    // We accept multiple field name variants — Trusta's exact keys evolve,
    // and we only expose opaque 0..1 signals downstream.
    const reputation =
      clamp01((data as any).trust_score) ??
      clamp01((data as any).reputation_score) ??
      clamp01((data as any).mediaScore) ??
      null;
    const risk =
      clamp01((data as any).risk_score) ??
      clamp01((data as any).riskLevel) ??
      (reputation !== null ? 1 - reputation : null);
    const sybil =
      clamp01((data as any).sybil_score) ??
      clamp01((data as any).sybilRisk) ??
      null;

    return {
      ...empty,
      reputation_signal: reputation,
      risk_signal: risk,
      sybil_signal: sybil,
      ok: reputation !== null || risk !== null || sybil !== null,
    };
  } catch (err) {
    console.warn("[diamonds/trusta] fetch failed:", (err as Error).message);
    return empty;
  }
}
