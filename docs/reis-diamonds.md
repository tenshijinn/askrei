# Rei's Diamonds — Wallet Behaviour Engine

Rei's Diamonds is Rei's proprietary Wallet Behaviour Engine. It fuses on-chain
signals from Moralis with reputation signals from Trusta AI (and, in future,
Helius / Birdeye / Nansen / Arkham) into a single explainable **Diamond Score**
plus five subscores. It is the successor to the Bluechip Score.

Rei's Diamonds is a **wallet reputation** system. It is separate from — and
does not modify — the transcript-based **Profile Score** (Communication,
Web3 Experience, Technical Skills, Role Fit).

## Response shape

`analyze-rei-profile` now returns a `wallet_behaviour` object alongside the
existing `wallet_verification`:

```json
{
  "wallet_behaviour": {
    "diamond_score": 91,
    "diamond_tier": "Rei's Diamond",
    "subscores": {
      "farmer":     { "score": 14, "reasons": ["Low wallet churn", "Consistent token retention"] },
      "jeet":       { "score": 9,  "reasons": ["Avg hold 47d", "No dump-then-empty patterns"] },
      "community":  { "score": 88, "reasons": ["Wallet active for 3.4 years", "Uses Jupiter, Marinade, Kamino"] },
      "risk":       { "score": 6,  "reasons": ["Clean reputation signal"] },
      "confidence": { "score": 82, "reasons": ["Multiple providers responded", "612 txns sampled"] }
    },
    "reasons": ["Wallet active for 3.4 years", "Healthy reputation", "Low suspicious activity"],
    "providers_used": ["moralis", "nomis"],
    "engine_version": "diamonds/1.0.0"
  }
}
```

Trusta's raw fields are never exposed — only normalized 0–1 signals are used
inside the engine.

## Tiers

| Range   | Tier            |
|---------|-----------------|
| 0–29    | 🪨 Coal          |
| 30–54   | 🟢 Emerald       |
| 55–74   | 🔷 Sapphire      |
| 75–89   | 💎 Diamond       |
| 90–100  | 👑 Rei's Diamond |

## Subscores

- **💎 Diamond Score** — the composite (`0.35·Community + 0.20·(100−Farmer) + 0.20·(100−Jeet) + 0.15·(100−Risk) + 0.10·Confidence`).
- **🌱 Farmer Score** — higher = more airdrop-farmer-like. Driven by churn, short holds, low protocol depth.
- **📉 Jeet Score** — higher = more dumpy. Driven by fast-sell ratio and avg hold time.
- **🤝 Community Score** — the primary "positive" score. Driven by wallet age, protocol diversity, NFT holdings, and reputation.
- **⚠ Risk Score** — Trusta risk / sybil signals plus heuristic red flags.
- **🎯 Confidence Score** — data completeness. Tells the reader how much to trust the other scores.

Every subscore carries up to five short human-readable `reasons`. If Trusta is
unavailable, the engine still runs on Moralis alone; `providers_used` and
`Confidence Score` reflect that.

## Storage

Persisted on `rei_registry`:
- `diamond_score` — int, 0–100
- `diamond_tier` — text
- `wallet_behaviour` — jsonb (full profile)

The full profile is also available inside `profile_analysis.wallet_behaviour`
for backwards compatibility.

## Adding a provider

1. Create `supabase/functions/_shared/diamonds/providers/<name>.ts`.
2. Export a `fetch<Name>Signals(address)` that returns `NormalizedSignals`.
   Fail soft — return `{ ok: false, ... }` on any error or missing key.
3. Call it from `analyze-rei-profile/index.ts` and add the result to the
   `computeDiamonds([...])` array.

No engine or response-schema changes are required; new providers simply
enrich the merged signal set.

## Secrets

- `MORALIS_API_KEY` — required.
- `TRUSTA_API_KEY` — optional; the engine degrades to Moralis-only when missing.
