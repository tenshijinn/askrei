## Goal

Make Bounty Promotions a real, user-scoped analytics section: link each promotion to the buyer's Rei identity, track every click on the promoted link, award points for promoting, and render live charts in the Account page.

## 1. Schema changes (migration)

**`campaign_subscriptions`** — add user identity (nullable so historic rows aren't broken):
- `x_user_id text`
- `wallet_address text`
- `short_code text unique` — short slug used in `/c/:code` tracking URL (generated at checkout)
- index on `(x_user_id)` and `(wallet_address)`
- RLS: add policy `Users can view their own promotions` using `x_user_id = current x identity` (read via existing pattern — `rei_registry` join on `auth.uid()`).

**`campaign_clicks`** (new):
- `campaign_subscription_id uuid references campaign_subscriptions(id) on delete cascade`
- `short_code text not null`
- `ip_hash text`, `user_agent_hash text`, `referrer text`, `session_id uuid`
- `click_date date`, `clicked_at timestamptz default now()`
- `is_unique boolean` (first time this `ip_hash` hits this campaign within window)
- `points_awarded boolean default false`
- GRANTs: `SELECT` to `authenticated` (scoped by RLS), `ALL` to `service_role`. No `anon`.
- RLS: owners can `SELECT` their campaign's clicks (join through `campaign_subscriptions`).
- Indexes: `(campaign_subscription_id, click_date)`, `(short_code)`, `(ip_hash, campaign_subscription_id)`.

**Points config**: 1 point per unique click on a promoted campaign (mirrors referral clicks). Hourly rate limit per IP. Idempotent via `(short_code, ip_hash, click_date)` unique constraint.

## 2. Checkout wiring

**`create-checkout` edge function** — when starting a promotion checkout:
- Accept `x_user_id` and `wallet_address` in body; pass them through Stripe `metadata`.
- Generate a `short_code` (8-char base62) and pass via metadata.

**`payments-webhook`** — on `checkout.session.completed` for promotion products:
- Persist `x_user_id`, `wallet_address`, `short_code` into the new `campaign_subscriptions` columns.
- Replace any rendered project link in the user's promo material with `https://rei.chat/c/<short_code>`.

## 3. Tracking endpoint

**New edge function `track-campaign-click`** (public, `verify_jwt = false`):
- Route: invoked from `/c/:code` page (SPA) which immediately calls the function then `window.location.replace(project_link)`.
- Logic mirrors `track-referral-click`: hash IP/UA, dedupe per IP per day, rate-limit, insert row, mark `is_unique`, on unique award **1 point** via `increment_user_points` to the promoter's wallet, write a `points_transactions` row with `transaction_type='promotion_click'`.
- Returns `{ redirect: project_link }`.

**New route `/c/:code`** (`src/pages/CampaignRedirect.tsx`) — fires the function then redirects. Mirrors `ReferralRedirect.tsx`.

## 4. UI: live Bounty Promotions

Rewrite `src/components/rei/BountyPromotions.tsx` to query live data:
- Load the logged-in user's `x_user_id`/`wallet_address` from `rei_registry`.
- Query `campaign_subscriptions` filtered by that identity.
- For each campaign, aggregate `campaign_clicks` for the selected range (All / 30d / 7d): `total`, `unique` (distinct `ip_hash`), `series` (daily buckets), `ctr = unique/total*100`.
- Loading skeletons, empty state ("You haven't promoted any bounties yet — promote one to see analytics here"), error toast.
- Keep current visual design (status pill, stat card, line chart, range selector).

## 5. Backfill / migration notes

Existing `campaign_subscriptions` rows have no user link and no `short_code`, so they won't appear in any user's panel and won't have click data. Acceptable — tracking starts now. If the user wants, we can add an admin tool later to manually attach an `x_user_id` to legacy rows.

## Technical summary

- 1 migration (2 tables touched, 1 new table, RLS + GRANTs).
- 1 new edge function (`track-campaign-click`) + config block.
- Edits to `create-checkout` and `payments-webhook`.
- New page `CampaignRedirect.tsx` + route in `App.tsx`.
- Rewrite of `BountyPromotions.tsx` for live data.
- Points: 1 per unique click, recorded in existing `user_points` + `points_transactions`.

## Open question

OK to set **1 point per unique click on a promoted campaign** (same as referral clicks)? If you'd prefer a different value (e.g. 2 or 5), say so and I'll use that.
