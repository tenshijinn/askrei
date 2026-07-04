## Problem

The hero pill "**52 bounties aggregated worth $61.0K+**" pulls two independent numbers:

- **Bounties count** — live `SELECT count(*) FROM tasks` (`ScrollVideoHero.tsx` line ~44). Goes up as new rows land.
- **USD value** — `platform_stats.total_value_usd`, recomputed each run of the `price-bounties` edge function by summing `compensation_amount_usd` across the current `tasks` table (no expiry filter).

The suspected "30-day expiry" filter exists (in `v_public_tasks` and `rei-chat` search), but it does **not** affect the stats — the pill reads raw `tasks` + `platform_stats`, both unfiltered.

So the USD can only go down if a priced row is later removed/overwritten (e.g. re-upsert with a changed compensation string that hasn't been re-priced yet, or a manual delete). Either way, the user's ask is unambiguous: **stats must be monotonic — once a bounty has been counted, it should stay counted, forever.**

## Plan

1. **Add lifetime columns to `platform_stats`** (schema migration):
   - `lifetime_bounties INTEGER NOT NULL DEFAULT 0`
   - `lifetime_value_usd NUMERIC NOT NULL DEFAULT 0`
   - Seed both with the current live values (`total_bounties`, `total_value_usd`) so we don't start from zero.

2. **Update `price-bounties` edge function** to write monotonic lifetime values:
   - Compute the live count/sum as today.
   - Set `lifetime_bounties = GREATEST(existing.lifetime_bounties, live_count)`.
   - Set `lifetime_value_usd = GREATEST(existing.lifetime_value_usd, live_sum)`.
   - Keep `total_bounties` / `total_value_usd` as-is (they still reflect current DB state and are useful for debugging).

3. **Point the hero pill at the lifetime numbers** in `src/components/joinrei/ScrollVideoHero.tsx`:
   - `useBountyCount` reads `platform_stats.lifetime_bounties` (single query, no live `tasks` count).
   - `useBountyValueUsd` reads `platform_stats.lifetime_value_usd`.
   - Both use the same row → count and value stay in lockstep and only ever grow.

4. **Kick `price-bounties` once** after deploy so lifetime values are populated immediately.

## Out of scope

- No changes to `v_public_tasks` or the 30-day search filter — those are correct for user-facing feed/search.
- No changes to `sync-drive-tasks` ingestion — it already preserves `compensation_amount_usd` across re-upserts.
- No historical backfill beyond seeding lifetime with the current live values (we can't reconstruct bounties that have already been deleted).

## Technical notes

- Files touched: `supabase/migrations/<new>.sql`, `supabase/functions/price-bounties/index.ts`, `src/components/joinrei/ScrollVideoHero.tsx`.
- The `BOUNTY_COUNT_KEY` localStorage cache in `ScrollVideoHero` stays; it'll just cache the lifetime count.
- `platform_stats` already has `SELECT` granted to `anon` + `authenticated`, so the client read continues to work.
