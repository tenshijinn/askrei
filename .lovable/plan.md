# Rei's Diamonds — Wallet Behaviour Engine (v2 of wallet intelligence)

## Objective
Replace the single "Bluechip Score" with **Rei's Diamonds** — a proprietary Wallet Behaviour Engine that fuses Moralis on-chain signals with Trusta AI reputation signals and outputs a branded, explainable Diamond Score plus subscores. Onboarding flow, Profile Score, and Moralis integration all stay intact.

## Non-goals (explicit)
- Do not modify the onboarding UX or transcript-based Profile Score (Communication / Web3 / Technical / Role Fit).
- Do not remove the Moralis tool-calling in `analyze-rei-profile`.
- Do not expose Trusta's raw scores in any response.

---

## Architecture

```text
                          ┌──────────────────────────────┐
transcript ──▶ Profile ──▶│  analyze-rei-profile         │──▶ profile_score (unchanged)
                          │                              │
wallet ─────▶ Moralis ───▶│  Wallet Behaviour Engine     │──▶ wallet_behaviour {
              (portfolio, │  (pluggable providers)       │      diamond_score, tier,
               swaps,     │                              │      subscores, reasons,
               tokens,    │                              │      providers_used }
               nfts)      │                              │
wallet ─────▶ Trusta ────▶│                              │
              (MEDIA,     │                              │
               reputation)│                              │
                          └──────────────────────────────┘
```

Providers are behind a common `WalletSignalProvider` interface (`fetch(address) → NormalizedSignals`). Adding Helius / Birdeye / Nansen / Arkham later is a new file that exports the same interface — the engine and response shape stay the same.

---

## Deliverables

### 1. New shared module: `supabase/functions/_shared/diamonds/`
- `providers/moralis.ts` — wraps the four existing Moralis endpoints (unchanged surface) and normalizes into `NormalizedSignals`.
- `providers/trusta.ts` — calls Trusta AI MEDIA / reputation endpoints, normalizes to the same shape. Fails soft (returns `null` on error/missing key so the engine still produces a score from Moralis alone).
- `engine.ts` — pure function `computeDiamonds(signals) → WalletBehaviourProfile` with weighted, transparent scoring. No Trusta raw fields leak out.
- `tiers.ts` — maps `diamond_score` → `Coal | Emerald | Sapphire | Diamond | Rei's Diamond`.
- `types.ts` — `WalletBehaviourProfile`, `SubscoreWithReasons`, provider interfaces.

### 2. `analyze-rei-profile/index.ts` changes
- After the existing Moralis tool loop finishes, call `computeDiamonds({ moralis: <raw>, trusta: <optional raw> })`.
- Extend the returned JSON with a new `wallet_behaviour` object (see schema below). Keep `wallet_verification` populated for backwards compatibility, but drop `bluechip_score` from the prompt/spec — it's superseded by `diamond_score`. `notable_interactions` stays.
- Prompt no longer asks the LLM to compute bluechip math; the engine owns scoring. LLM keeps parsing project identifiers.

### 3. `submit-rei-registration/index.ts`
- Persist top-level fields on `rei_registry`: `diamond_score`, `diamond_tier`, and full `wallet_behaviour` jsonb. Leave existing columns alone.

### 4. Database migration
- `ALTER TABLE public.rei_registry ADD COLUMN diamond_score int, diamond_tier text, wallet_behaviour jsonb;` — nullable, no backfill required. GRANTs already in place for existing columns cover ALTERs.

### 5. Minimal UI touch (branding correctness, no new pages)
- `src/components/TalentCard.tsx`: replace the "✓ Bluechip" badge and "Bluechip Score" line with a Diamond tier chip (💎 tier name) + Diamond Score. Kept in the same slot — no layout redesign.
- Everything else defers to a follow-up plan for a full Diamonds panel on `/rei`.

### 6. Docs
- `docs/reis-diamonds.md` — engine overview, score meanings, provider plug-in guide, response schema. Linked from `docs/agent-integration.md`.

---

## Score model (proprietary, explainable)

Each subscore is 0–100 with a `reasons: string[]` array. Weights below are the v1 defaults, all live in `engine.ts` so they're easy to tune:

| Score | Signals | Notes |
|---|---|---|
| 💎 **Diamond Score** | Weighted composite of the five below | `0.35·Community + 0.20·(100−Farmer) + 0.20·(100−Jeet) + 0.15·(100−Risk) + 0.10·Confidence` |
| 🌱 Farmer Score | High wallet churn, short holds, repeated airdrop-claim patterns from swaps, low protocol depth | Higher = more farmer-like |
| 📉 Jeet Score | Fast sells after receipt, low avg holding time, dump-then-empty patterns | Higher = more jeet-like |
| 🤝 Community Score | Protocol diversity, sustained multi-year activity, reputable NFT holdings, positive Trusta signals normalized | Rewards genuine participation |
| ⚠ Risk Score | Trusta sybil/risk signal (if available), abnormal patterns, sanctioned-token exposure | Higher = riskier |
| 🎯 Confidence Score | Data completeness: providers responded, sample sizes, tx count over threshold | Tells the reader how much to trust the other scores |

Tier map: `0–29 Coal · 30–54 Emerald · 55–74 Sapphire · 75–89 Diamond · 90–100 Rei's Diamond`.

Every subscore emits ≤5 short human-readable reasons pulled directly from the signal that moved it (e.g. `"Wallet active for 3.4 years"`, `"Avg hold time 47 days"`, `"Consistent Jupiter + Marinade usage"`).

---

## Response schema (added to `analyze-rei-profile` output)

```json
"wallet_behaviour": {
  "diamond_score": 91,
  "diamond_tier": "Rei's Diamond",
  "subscores": {
    "farmer":     { "score": 14, "reasons": ["Low wallet churn", "Consistent token retention"] },
    "jeet":       { "score": 9,  "reasons": ["Avg hold 47d", "No dump-then-empty patterns"] },
    "community":  { "score": 88, "reasons": ["3.4y active", "Uses Jupiter, Marinade, Kamino"] },
    "risk":       { "score": 6,  "reasons": ["Clean reputation signal", "No flagged counterparties"] },
    "confidence": { "score": 82, "reasons": ["Both providers responded", "612 txns sampled"] }
  },
  "reasons": ["Wallet active for 3.4 years", "Healthy reputation", "Long avg holding periods"],
  "providers_used": ["moralis", "trusta"],
  "engine_version": "diamonds/1.0.0"
}
```

Trusta raw fields never appear in the response.

---

## Secrets & external dependencies
- `MORALIS_API_KEY` — already configured.
- `TRUSTA_API_KEY` — will be requested via `add_secret` when we enter build mode. If missing at runtime, the Trusta provider returns `null` and the engine drops to Moralis-only mode (marked in `providers_used`, `Confidence Score` reflects it). This keeps the plan shippable even before the key exists.

---

## Rollout order (in build mode)
1. Migration (add 3 columns).
2. Shared `_shared/diamonds/` module (types + Moralis provider + engine + tiers) — pure, unit-testable in isolation.
3. Wire engine into `analyze-rei-profile`; keep `wallet_verification` populated for compatibility.
4. `submit-rei-registration` persistence for the new columns.
5. Trusta provider + `add_secret` for `TRUSTA_API_KEY`.
6. `TalentCard` badge swap (Bluechip → Diamond tier).
7. Docs page and link from `docs/agent-integration.md`.
8. Trigger one live analyze run to verify end-to-end.

---

## Open questions (I'll assume these unless you say otherwise)
- **Trusta credentials**: I'll request `TRUSTA_API_KEY` via `add_secret` in build mode. If you want to ship Moralis-only first and add Trusta later, say the word — the plug-in architecture supports it and no code changes.
- **UI scope**: engine + API + the small TalentCard badge swap only. A full "Diamonds" panel on `/rei` (tier progression, subscore breakdown, reasons) is intentionally out of scope for this plan — happy to do it as a follow-up once you're happy with the engine output.
- **Moralis Solana Score sunset (July 31 2026)**: we already confirmed we don't read the embedded `score` field, so no cleanup needed here.
