## Plan: Recalibrate Diamonds engine + wire Birdeye

### 1. Add Birdeye API key
Request `BIRDEYE_API_KEY` via `add_secret`. The `fetchBirdeyeSignals` provider is already wired in `analyze-rei-profile` and `rescan-diamond-scores` — it will start returning `ok:true` automatically once the key is present.

### 2. Derive behavioural signals from raw data (proprietary IP layer)
Create `supabase/functions/_shared/diamonds/derive.ts` exporting `deriveBehaviouralSignals(rawTxns, rawSwaps)`:
- `avg_hold_days` — per-token: weighted-avg time between first buy and matched sell (FIFO).
- `fast_sell_ratio` — share of sells that closed a position within 24h of the matching buy.
- `churn_rate` — tokens sold-to-zero ÷ tokens ever held.
- `unique_protocols` — extract program/contract labels from Helius enriched txns / Moralis swap DEX names.

Hook it into the Moralis + Helius provider paths so `NormalizedSignals` now carries these derived fields instead of `null`.

### 3. Recalibrate engine (fixes "empty wallet = Sapphire")
In `supabase/functions/_shared/diamonds/engine.ts`:

- **Null-penalise Farmer/Jeet/Risk inverses.** When a subscore's inputs are all `null`, treat that subscore as `50` (unknown), not `0` (clean). This removes the ~55-point free baseline for empty wallets.
- **Activity gate on Community.** Community's full weight only applies when the wallet meets a minimum-history floor: `transaction_count ≥ 25` AND `account_age_days ≥ 30`. Below the floor, scale Community's contribution linearly (0 at zero activity, full at the floor).
- **Confidence gates the composite.** Multiply final Diamond by `min(1, confidence/60)` so a low-confidence wallet cannot land above ~mid-Sapphire regardless of other scores.
- **New "Insufficient history" reason** surfaced in `reasons[]` when the activity gate fires.

Net effect: a fresh, empty wallet now lands in Coal/Emerald (~15–35), not Sapphire.

### 4. Rescan + report
- Deploy, then invoke `rescan-diamond-scores` with no filter to recompute all 4 registered wallets.
- Produce a results table with columns you can use for gamification/marketing:

  | Handle | Wallet | Score | Tier | Community | Farmer | Jeet | Risk | Confidence | Age (d) | Txns | Protocols | Avg hold (d) | Fast-sell % | Providers |

- Table is produced in chat only (no schema changes — all fields already live in `wallet_behaviour` jsonb on `rei_registry`, so backend can query them any time for leaderboards/segments).

### Files touched
- New: `supabase/functions/_shared/diamonds/derive.ts`
- Edit: `supabase/functions/_shared/diamonds/engine.ts`
- Edit: `supabase/functions/_shared/diamonds/providers/moralis.ts` (call derive on raw swaps)
- Edit: `supabase/functions/_shared/diamonds/providers/helius.ts` (call derive on enriched txns)
- Secret: request `BIRDEYE_API_KEY`

No DB migrations, no frontend changes.
