## Part 1 — Rei's Diamonds in the Capabilities card (owner-only)

Add a sparse on-chain summary block at the top of the existing Capabilities card in `src/pages/Rei.tsx` (around line 486–490). Data source: `rei_registry.diamond_score`, `diamond_tier`, `wallet_behaviour` (subscores), `wallet_address`, `evm_wallet_address` — all already populated by the engine.

Rendered elements (sparse, one row):
- Diamond Score (big number) + tier label (e.g. "Rei's Diamond"), styled like the existing profile_score number.
- Chains connected: SOL pill with truncated `wallet_address`; ETH pill with truncated `evm_wallet_address` if present.
- Subscore highlights: 3 chips — the top-signal subscores from `wallet_behaviour.subscores` (pick the highest-scoring non-risk one + `community` + `risk` inverted as "trust"), each shown as `Label · NN`.
- "Share card" button that opens a modal (see Part 2).

Owner-only: nothing added to `TalentCard.tsx`. Data stays fetched via the existing `registrationData` query already scoped to the signed-in user.

## Part 2 — "Rei's Diamond" share card

New component `src/components/rei/ReiDiamondShareCard.tsx`:
- Dialog with a rendered 1200×630 (or 1:1 square) card containing: X avatar, `@handle`, Diamond Score, tier name/emoji, 3 subscore chips, small "rei.chat" wordmark. No wallet addresses, no raw signals, no email.
- Two actions: **Download PNG** (via `html-to-image` — small dep, already used pattern in Lovable projects; if not present, use canvas snapshot with a simple DOM-to-canvas approach) and **Share on X** (opens `x.com/intent/tweet` with text like "My Rei's Diamond score: 87 · Tier X. Get yours at rei.chat").
- Purely client-side, no new tables.

## Part 3 — Bounty impression tracking

### Schema (migration)
Add `campaign_impressions` table:
- `campaign_subscription_id uuid` (FK to campaign_subscriptions.id)
- `short_code text`
- `ip_hash text`, `user_agent_hash text`, `session_id uuid`
- `impression_date date`, `viewed_at timestamptz`
- `is_unique boolean` (unique per ip_hash + short_code + date)

GRANTs + RLS: insert via edge function (service role) only; SELECT to authenticated for owner (via campaign ownership). Add RPC `get_campaign_impression_stats(p_campaign_ids uuid[])` mirroring `get_campaign_click_stats` returning daily totals + unique.

### Edge function
New `supabase/functions/track-campaign-impression/index.ts` — mirrors `track-campaign-click` (hash IP/UA, dedupe per day, rate-limit) but does NOT award points. Called from client when a bounty card first becomes visible.

### Client wiring
- Add `useImpressionTracker(shortCode)` hook using `IntersectionObserver` (threshold 0.5, 500ms dwell) that fires once per `short_code` per session (sessionStorage guard) and calls the edge function.
- Attach to `TaskPreviewCard` (chat) and any list bounty card that has a `tracking_short_code`. Skip if no short_code.

### Analytics UI
In `src/components/rei/BountyPromotions.tsx`:
- Fetch impressions via new RPC in parallel with click stats.
- Extend `CampaignView` with `totalImpressions`, `uniqueImpressions`, and recompute `CTR = uniqueClicks / uniqueImpressions * 100` (fallback to old formula when impressions=0 to avoid breakage on historical campaigns).
- Add "Impressions" stat to the 3-stat block → becomes a 4-stat grid (Impressions, Unique Clicks, Total Clicks, CTR).
- Add impressions line to the daily chart (second Line series in different tone).

## Technical notes
- No changes to points logic — impressions are metrics only.
- CTR formula change is scoped to the promoter analytics component; global bounty stats untouched.
- Impression edge function needs `verify_jwt = false` entry in `supabase/config.toml`.
- Rate limit: cap 200 impressions/IP/hour to prevent spam.

## Files touched
- `supabase/migrations/*` — new table, GRANTs, RLS, RPC
- `supabase/functions/track-campaign-impression/index.ts` (new)
- `supabase/config.toml` — add function entry
- `src/hooks/useImpressionTracker.ts` (new)
- `src/components/chat/TaskPreviewCard.tsx` — attach tracker
- `src/components/rei/ReiDiamondShareCard.tsx` (new)
- `src/pages/Rei.tsx` — Capabilities card additions + share button
- `src/components/rei/BountyPromotions.tsx` — impressions + CTR
