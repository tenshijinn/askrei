## What's actually happening

The three bad URLs you're seeing in chat are coming from the **localStorage task preview cache** (currently 24h TTL), not from the database. The DB rows are already correct. Separately, we shouldn't be rewriting Superteam URLs on our side at all — if their format changes, our hardcoded canonical breaks every link.

## Plan

1. **Stop rewriting Superteam URLs in `sync-drive-tasks`**
   - Remove the `normalizeSuperteamUrl` function and its call site in `mapBounty`.
   - Remove the now-unused `slugifyTitle` helper.
   - The `link` field passes through from the source JSON exactly as provided.

2. **Shorten the task preview cache TTL to 1 hour**
   - In `src/hooks/useTaskPreview.ts`, change `TTL_MS` from 24h to 1h.
   - Resource impact is minimal: the preview query selects 7 columns from one row by primary key, with in-flight de-duping already in place. Going from 24h → 1h means at worst one extra lightweight query per task card per hour per browser. Totally fine.

3. **Re-deploy and re-sync**
   - Deploy the updated `sync-drive-tasks` function.
   - Trigger one manual sync so all rows reflect exactly what the source provides (this will also overwrite the previously force-corrected "Explain Defunds Finance" row with whatever the source actually has).

4. **No data migration needed**
   - The next sync reconciles everything from the source feed.

## Files touched

- `supabase/functions/sync-drive-tasks/index.ts` — strip URL normalization logic.
- `src/hooks/useTaskPreview.ts` — `TTL_MS` → 1 hour.