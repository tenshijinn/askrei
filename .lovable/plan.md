## Root cause (verified)

- All 263 aggregated bounty campaigns are already correctly attached to `@wayneanthonyd` (`x_user_id=1288555819248877568`, wallet `2gvgWc…HrBt`), status `active`. Data assignment is fine.
- `BountyPromotions.tsx` queries `v_public_campaign_subscriptions` and filters with `.or('x_user_id.eq.<id>,wallet_address.eq.<wallet>')`.
- The view's definition (verified with `\d+`) does NOT expose `x_user_id` or `wallet_address` columns — it only has `id, project_name, project_link, short_code, status, source, screenshot_url, tasks_imported_count, scrape_count, last_scraped_at, expires_at, created_at, updated_at`.
- The filter therefore references non-existent columns → PostgREST throws → the component's `catch` block silently sets campaigns to `[]` → empty state. That's why the promoter analytics look empty despite the DB being populated.

Confirmed via `psql`: `SELECT ... FROM v_public_campaign_subscriptions WHERE x_user_id=...` returns `ERROR: column "x_user_id" does not exist`.

Nothing about the last "sticky assignment" turn caused this — the query has been broken for these fields the whole time; it only surfaced now because you're checking analytics after redoing your account.

## Fix

Migration: recreate `v_public_campaign_subscriptions` to include `x_user_id` and `wallet_address` (plus existing columns). Re-grant `SELECT` to `anon, authenticated` since `CREATE OR REPLACE VIEW` doesn't change grants but a `DROP + CREATE` requires them. Keep `security_invoker=on`.

Exposure impact: `wallet_address` is public on-chain; `x_user_id` is a Twitter numeric ID already discoverable via public profile lookups. Same shape as `campaign_clicks` short-code lookups the tracking function already relies on. No PII (no email) added.

No client changes required — the existing `.or(x_user_id.eq…,wallet_address.eq…)` filter will start working immediately once the view exposes those columns.

## Files touched

- `supabase/migrations/*` — recreate view with `x_user_id`, `wallet_address`, re-grant SELECT.

## Validation

After apply, refresh the Account page → Bounty Promotions section should populate 263 aggregated bounty rows (or paginated subset) with impressions/CTR flowing in.
