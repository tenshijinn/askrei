// Rei's Diamonds engine — pure, deterministic scoring over NormalizedSignals.
// Adding a provider does NOT touch this file; provider signals merge into a
// single NormalizedSignals bundle before compute.

import type { NormalizedSignals, SubscoreWithReasons, WalletBehaviourProfile } from "./types.ts";
import { tierForScore } from "./tiers.ts";

export const ENGINE_VERSION = "diamonds/1.0.0";

// Weights for composing Diamond Score from the five subscores.
// Tune here — this is the only place composition weights live.
const WEIGHTS = {
  community: 0.35,
  farmerInverse: 0.20,
  jeetInverse: 0.20,
  riskInverse: 0.15,
  confidence: 0.10,
} as const;

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function push(reasons: string[], line: string | null | undefined): void {
  if (!line) return;
  if (reasons.length >= 5) return;
  reasons.push(line);
}

// Merge signals from multiple providers into a single NormalizedSignals view
// used by the engine. Non-null on-chain fields prefer whichever provider
// reported them (Moralis wins for on-chain; Trusta wins for reputation).
export function mergeSignals(signals: NormalizedSignals[]): NormalizedSignals {
  const merged: NormalizedSignals = {
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
    provider: "merged",
    ok: signals.some((s) => s.ok),
  };
  const protos = new Set<string>();
  const cols = new Set<string>();
  for (const s of signals) {
    if (!s.ok) continue;
    merged.account_age_days ??= s.account_age_days;
    merged.first_activity_at ??= s.first_activity_at;
    merged.last_activity_at ??= s.last_activity_at;
    merged.transaction_count ??= s.transaction_count;
    merged.swap_count ??= s.swap_count;
    merged.token_count ??= s.token_count;
    merged.nft_count ??= s.nft_count;
    merged.avg_hold_days ??= s.avg_hold_days;
    merged.churn_rate ??= s.churn_rate;
    merged.fast_sell_ratio ??= s.fast_sell_ratio;
    merged.reputation_signal ??= s.reputation_signal;
    merged.risk_signal ??= s.risk_signal;
    merged.sybil_signal ??= s.sybil_signal;
    for (const p of s.unique_protocols) protos.add(p);
    for (const c of s.unique_nft_collections) cols.add(c);
  }
  merged.unique_protocols = [...protos];
  merged.unique_nft_collections = [...cols];
  return merged;
}

function farmerScore(s: NormalizedSignals): SubscoreWithReasons {
  const reasons: string[] = [];
  let score = 0;

  if (s.churn_rate !== null) {
    score += s.churn_rate * 40;
    if (s.churn_rate > 0.6) push(reasons, `High wallet churn (${Math.round(s.churn_rate * 100)}%)`);
    else if (s.churn_rate < 0.25) push(reasons, "Low wallet churn");
  }
  if (s.avg_hold_days !== null) {
    if (s.avg_hold_days < 3) {
      score += 25;
      push(reasons, `Very short avg hold (${s.avg_hold_days.toFixed(1)}d)`);
    } else if (s.avg_hold_days > 30) {
      score -= 10;
      push(reasons, `Consistent token retention (${s.avg_hold_days.toFixed(0)}d avg hold)`);
    }
  }
  if (s.unique_protocols.length <= 1 && (s.swap_count ?? 0) > 10) {
    score += 15;
    push(reasons, "Low protocol depth despite high activity");
  } else if (s.unique_protocols.length >= 4) {
    score -= 10;
    push(reasons, `Broad protocol usage (${s.unique_protocols.length} protocols)`);
  }
  if ((s.swap_count ?? 0) > 200 && (s.account_age_days ?? 0) < 90) {
    score += 20;
    push(reasons, "High-frequency activity on a young wallet");
  }
  if (reasons.length === 0) push(reasons, "No obvious farming patterns");

  return { score: clamp(score), reasons };
}

function jeetScore(s: NormalizedSignals): SubscoreWithReasons {
  const reasons: string[] = [];
  let score = 0;

  if (s.fast_sell_ratio !== null) {
    score += s.fast_sell_ratio * 60;
    if (s.fast_sell_ratio > 0.5) push(reasons, `${Math.round(s.fast_sell_ratio * 100)}% of sells within 24h`);
    else if (s.fast_sell_ratio < 0.15) push(reasons, "No dump-then-empty patterns");
  }
  if (s.avg_hold_days !== null) {
    if (s.avg_hold_days < 2) {
      score += 25;
      push(reasons, `Avg hold under 2 days`);
    } else if (s.avg_hold_days > 21) {
      score -= 10;
      push(reasons, `Avg hold ${s.avg_hold_days.toFixed(0)}d`);
    }
  }
  if (reasons.length === 0) push(reasons, "Balanced buy/sell rhythm");

  return { score: clamp(score), reasons };
}

function communityScore(s: NormalizedSignals): SubscoreWithReasons {
  const reasons: string[] = [];
  let score = 0;

  if (s.account_age_days !== null) {
    if (s.account_age_days >= 365 * 3) {
      score += 35;
      push(reasons, `Wallet active for ${(s.account_age_days / 365).toFixed(1)} years`);
    } else if (s.account_age_days >= 365 * 2) {
      score += 25;
      push(reasons, `Wallet active for ${(s.account_age_days / 365).toFixed(1)} years`);
    } else if (s.account_age_days >= 365) {
      score += 15;
      push(reasons, "Over a year of activity");
    } else if (s.account_age_days >= 90) {
      score += 5;
    }
  }
  if (s.unique_protocols.length >= 3) {
    score += 20;
    push(reasons, `Uses ${s.unique_protocols.slice(0, 3).join(", ")}`);
  } else if (s.unique_protocols.length >= 1) {
    score += 8;
    push(reasons, `Uses ${s.unique_protocols[0]}`);
  }
  if (s.unique_nft_collections.length >= 3) {
    score += 10;
    push(reasons, `Holds ${s.unique_nft_collections.length} NFT collections`);
  }
  if ((s.transaction_count ?? 0) >= 100) {
    score += 15;
    push(reasons, `${s.transaction_count}+ transactions`);
  } else if ((s.transaction_count ?? 0) >= 25) {
    score += 8;
  }
  if (s.reputation_signal !== null) {
    score += s.reputation_signal * 20;
    if (s.reputation_signal >= 0.7) push(reasons, "Healthy wallet reputation");
  }
  if (reasons.length === 0) push(reasons, "Limited on-chain history");

  return { score: clamp(score), reasons };
}

function riskScore(s: NormalizedSignals): SubscoreWithReasons {
  const reasons: string[] = [];
  let score = 0;

  if (s.risk_signal !== null) {
    score += s.risk_signal * 60;
    if (s.risk_signal >= 0.6) push(reasons, "Elevated risk signal from reputation provider");
    else if (s.risk_signal <= 0.2) push(reasons, "Clean reputation signal");
  }
  if (s.sybil_signal !== null) {
    score += s.sybil_signal * 40;
    if (s.sybil_signal >= 0.5) push(reasons, "Elevated sybil similarity");
  }
  if ((s.account_age_days ?? 0) < 30 && (s.swap_count ?? 0) > 50) {
    score += 15;
    push(reasons, "New wallet with heavy activity");
  }
  if (reasons.length === 0) push(reasons, "No flagged counterparties detected");

  return { score: clamp(score), reasons };
}

function confidenceScore(s: NormalizedSignals, providersOk: number): SubscoreWithReasons {
  const reasons: string[] = [];
  let score = 0;

  score += Math.min(40, providersOk * 25);
  push(reasons, providersOk >= 2 ? "Multiple providers responded" : providersOk === 1 ? "One provider responded" : "No providers responded");

  const txn = s.transaction_count ?? s.swap_count ?? 0;
  if (txn >= 500) {
    score += 40;
    push(reasons, `${txn}+ txns sampled`);
  } else if (txn >= 100) {
    score += 25;
    push(reasons, `${txn} txns sampled`);
  } else if (txn >= 25) {
    score += 12;
  } else {
    push(reasons, "Sparse on-chain sample");
  }
  if (s.account_age_days !== null && s.account_age_days >= 180) {
    score += 15;
  }
  if (s.reputation_signal !== null || s.risk_signal !== null) {
    score += 10;
  }

  return { score: clamp(score), reasons };
}

export function computeDiamonds(
  signals: NormalizedSignals[],
): WalletBehaviourProfile {
  const okSignals = signals.filter((s) => s.ok);
  const merged = mergeSignals(signals);
  const farmer = farmerScore(merged);
  const jeet = jeetScore(merged);
  const community = communityScore(merged);
  const risk = riskScore(merged);
  const confidence = confidenceScore(merged, okSignals.length);

  const diamondRaw =
    WEIGHTS.community * community.score +
    WEIGHTS.farmerInverse * (100 - farmer.score) +
    WEIGHTS.jeetInverse * (100 - jeet.score) +
    WEIGHTS.riskInverse * (100 - risk.score) +
    WEIGHTS.confidence * confidence.score;
  const diamond = clamp(diamondRaw);

  // Top-level reasons: cherry-pick the strongest positive drivers.
  const topReasons: string[] = [];
  push(topReasons, community.reasons[0]);
  if (farmer.score < 25) push(topReasons, "Low farmer-like behaviour");
  if (jeet.score < 25) push(topReasons, "Healthy holding behaviour");
  if (risk.score < 25) push(topReasons, "Low suspicious activity");
  if (confidence.score >= 60) push(topReasons, "High data confidence");
  if (topReasons.length === 0) push(topReasons, community.reasons[0] ?? "Limited data");

  return {
    diamond_score: diamond,
    diamond_tier: tierForScore(diamond),
    subscores: { farmer, jeet, community, risk, confidence },
    reasons: topReasons,
    providers_used: okSignals.map((s) => s.provider),
    engine_version: ENGINE_VERSION,
  };
}
