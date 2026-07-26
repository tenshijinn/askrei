# Rei's Diamonds — Wallet Behaviour Engine

Rei's Diamonds is Rei's proprietary Wallet Behaviour Engine. Third-party APIs
supply only **raw blockchain data**; all behavioural analysis and scoring
happens inside Rei. Providers are interchangeable and none is required for
the engine to produce a score.

Rei's Diamonds is a **wallet reputation** system. It is separate from — and
does not modify — the transcript-based **Profile Score** (Communication,
Web3 Experience, Technical Skills, Role Fit).

## Architecture

```text
Wallet
   ↓
Provider Layer  (raw blockchain data only)
   • Solana: Moralis, Helius, Birdeye
   • EVM:    Moralis, Alchemy, Blockscout
   • Future: Arkham, Nansen, Bubblemaps, labelling / reputation APIs
   ↓
NormalizedSignals  (single internal shape — see types.ts)
   ↓
Rei's Behaviour Engine  (all scoring is internal IP)
   ↓
Farmer · Jeet · Community · Risk · Confidence
   ↓
Diamond Score  +  Tier
```

Every provider converts its raw payload into the same `NormalizedSignals`
shape. Adding or replacing a provider requires no changes to the engine.

## Provider strategy

- **No provider is required.** The engine runs on whatever providers respond,
  and every provider fails soft (returns `ok: false` on error or missing key).
- **Providers only supply raw blockchain events.** They must never determine
  the Diamond Score. Any reputation / labelling provider added in future
  (Arkham, Nansen, Bubblemaps, …) is an *enrichment* signal only.
- **Chain-aware.** Solana addresses route to Solana providers; `0x…`
  addresses route to EVM providers.

## Response shape

`analyze-rei-profile` returns a `wallet_behaviour` object alongside the
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
      "risk":       { "score": 6,  "reasons": ["No flagged counterparties detected"] },
      "confidence": { "score": 82, "reasons": ["Multiple providers responded", "612 txns sampled"] }
    },
    "reasons": ["Wallet active for 3.4 years", "Low suspicious activity"],
    "providers_used": ["moralis", "helius"],
    "engine_version": "diamonds/1.0.0"
  }
}
```

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
- **🌱 Farmer Score** — higher = more airdrop-farmer-like (churn, short holds, low protocol depth).
- **📉 Jeet Score** — higher = more dumpy (fast-sell ratio, short avg hold).
- **🤝 Community Score** — the primary positive score (wallet age, protocol diversity, NFTs, transaction depth).
- **⚠ Risk Score** — heuristic red flags (new-wallet-heavy-activity, etc.) plus any optional reputation enrichment.
- **🎯 Confidence Score** — data completeness (providers responded, txns sampled, wallet age).

Every subscore carries up to five short human-readable `reasons`.

## Storage

Persisted on `rei_registry`:
- `diamond_score` — int, 0–100
- `diamond_tier` — text
- `wallet_behaviour` — jsonb (full profile)

## Adding a provider

1. Create `supabase/functions/_shared/diamonds/providers/<name>.ts`.
2. Export `fetch<Name>Signals(address)` returning `NormalizedSignals`.
   Fail soft — return `{ ok: false, ... }` on any error or missing key.
3. Call it from `analyze-rei-profile/index.ts` and add it to the array passed
   to `computeDiamonds([...])`. Route by chain if the provider is
   chain-specific.

No engine or response-schema changes are required.

## Secrets

- `MORALIS_API_KEY` — Solana + EVM raw data (currently the only always-on provider).
- `HELIUS_API_KEY` — optional; enriches Solana transaction history.
- `BIRDEYE_API_KEY` — optional; enriches Solana token portfolio.
- `ALCHEMY_API_KEY` — optional; enriches EVM transfers.
- Blockscout — public, no key required.

Every optional provider degrades gracefully when its key is absent.
