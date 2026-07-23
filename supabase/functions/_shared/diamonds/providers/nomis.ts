// Nomis (nomis.cc) provider — Solana wallet score + reputation signals.
// Fails soft: any error or missing credentials returns "ok: false" so the
// Diamonds engine can still produce a score from Moralis alone.
// Raw Nomis fields are NEVER returned — only opaque normalized 0..1 signals
// plus a few objective counters that the engine already understands.

import type { NormalizedSignals } from "../types.ts";

const NOMIS_BASE = "https://api.nomis.cc";

function clamp01(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n > 1 && n <= 100) return Math.max(0, Math.min(1, n / 100));
  return Math.max(0, Math.min(1, n));
}

export async function fetchNomisSignals(address: string): Promise<NormalizedSignals> {
  const apiKey = Deno.env.get("NOMIS_API_KEY");
  const clientId = Deno.env.get("NOMIS_CLIENT_ID");

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
    provider: "nomis",
    ok: false,
  };

  if (!apiKey || !clientId) {
    console.log("[diamonds/nomis] NOMIS_API_KEY / NOMIS_CLIENT_ID not configured — skipping");
    return empty;
  }

  try {
    const url = `${NOMIS_BASE}/api/v1/solana/wallet/${encodeURIComponent(address)}/score?getLastStatsFromDb=true`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "X-ClientId": clientId,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.warn(`[diamonds/nomis] HTTP ${res.status}`);
      return empty;
    }
    const body = await res.json().catch(() => null);
    if (!body || body.succeeded === false || !body.data) return empty;

    const data = body.data as any;
    const stats = (data.stats ?? {}) as any;

    // Reputation = Nomis Score (0..1). Risk = HAPI risk (opaque 0..1)
    // OR greysafe report count clamped, OR inverse of reputation.
    const reputation = clamp01(data.score);

    let risk: number | null = null;
    const hapi = stats.hapiRiskScore;
    if (hapi && typeof hapi === "object") {
      risk = clamp01(hapi.riskScore) ?? clamp01(hapi.risk);
    }
    if (risk === null && Array.isArray(stats.greysafeReports) && stats.greysafeReports.length) {
      risk = Math.min(1, stats.greysafeReports.length / 3);
    }
    if (risk === null && reputation !== null) risk = 1 - reputation;

    // Objective counters — safe to expose to the engine; they enrich the merge.
    const walletAgeMonths = typeof stats.walletAge === "number" ? stats.walletAge : null;
    const accountAgeDays = walletAgeMonths !== null ? Math.round(walletAgeMonths * 30.44) : null;
    const firstAt = typeof stats.firstTransactionDate === "string" ? stats.firstTransactionDate : null;

    // Counterparties -> unique protocols. Each entry usually has a name/label.
    const counterparties = Array.isArray(stats.counterpartiesData) ? stats.counterpartiesData : [];
    const uniqueProtocols = Array.from(
      new Set(
        counterparties
          .map((c: any) => (typeof c === "string" ? c : c?.name ?? c?.label ?? c?.protocol))
          .filter((s: unknown): s is string => typeof s === "string" && s.length > 0),
      ),
    );

    const nftCollections = Array.isArray(stats.nftCollectionHoldings)
      ? stats.nftCollectionHoldings
          .map((c: any) => (typeof c === "string" ? c : c?.name ?? c?.collection))
          .filter((s: unknown): s is string => typeof s === "string" && s.length > 0)
      : [];

    return {
      ...empty,
      account_age_days: accountAgeDays,
      first_activity_at: firstAt,
      last_activity_at: null,
      transaction_count: typeof stats.totalTransactions === "number" ? stats.totalTransactions : null,
      nft_count: typeof stats.nftHolding === "number" ? stats.nftHolding : null,
      token_count: typeof stats.tokensHolding === "number" ? stats.tokensHolding : null,
      unique_protocols: uniqueProtocols,
      unique_nft_collections: nftCollections,
      reputation_signal: reputation,
      risk_signal: risk,
      sybil_signal: null,
      ok: reputation !== null || risk !== null || accountAgeDays !== null,
    };
  } catch (err) {
    console.warn("[diamonds/nomis] fetch failed:", (err as Error).message);
    return empty;
  }
}
