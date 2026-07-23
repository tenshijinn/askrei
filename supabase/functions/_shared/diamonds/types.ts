// Rei's Diamonds — shared types for the Wallet Behaviour Engine.
// Providers normalize raw upstream data into NormalizedSignals; the engine
// consumes only NormalizedSignals so adding a new provider never changes
// the engine or the response shape.

export interface NormalizedSignals {
  // Wallet lifetime
  account_age_days: number | null;
  first_activity_at: string | null; // ISO
  last_activity_at: string | null; // ISO

  // Activity volume
  transaction_count: number | null;
  swap_count: number | null;

  // Holdings
  token_count: number | null;
  nft_count: number | null;

  // Diversity / depth
  unique_protocols: string[]; // labeled DEXs, DeFi protocols the wallet touched
  unique_nft_collections: string[]; // labeled NFT collections held

  // Behaviour
  avg_hold_days: number | null; // average token holding period
  churn_rate: number | null; // 0..1 — how often the wallet flips tokens
  fast_sell_ratio: number | null; // 0..1 — receive-then-sell within 24h

  // Reputation (opaque, provider-agnostic 0..1 normalization)
  reputation_signal: number | null; // higher = more trusted
  risk_signal: number | null; // higher = riskier
  sybil_signal: number | null; // higher = more sybil-like

  // Meta
  provider: string;
  ok: boolean; // false if the provider failed / had no data
}

export interface SubscoreWithReasons {
  score: number; // 0..100
  reasons: string[]; // <=5 short human-readable strings
}

export interface WalletBehaviourProfile {
  diamond_score: number; // 0..100
  diamond_tier: string;
  subscores: {
    farmer: SubscoreWithReasons;
    jeet: SubscoreWithReasons;
    community: SubscoreWithReasons;
    risk: SubscoreWithReasons;
    confidence: SubscoreWithReasons;
  };
  reasons: string[]; // top explanation bullets for the overall Diamond Score
  providers_used: string[];
  engine_version: string;
}

export interface WalletSignalProvider {
  name: string;
  fetch(address: string): Promise<NormalizedSignals>;
}
