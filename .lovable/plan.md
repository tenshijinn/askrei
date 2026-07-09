# Fix: daily bounty sync silently timing out

## Root cause

The `sync-drive-tasks-daily` pg_cron job fires at 09:00 UTC every day and pg_cron reports "succeeded" — but that only means "http request was queued". The actual HTTP call to the edge function is aborted after 5 seconds by pg_net's default timeout. Evidence from `net._http_response`:

```
error_msg: Timeout of 5000 ms reached (HTTP Request/Response time: 4771 ms)
```

The function needs longer than 5s because it now scrapes `og:image` (HTML fetch, up to 256KB, concurrency 8) for every bounty missing one before upserting. Result: no new bounties land, `platform_stats` stays at **92 / $102.9K** since July 6.

The Drive feed itself may or may not have new bounties — we can't tell until the function is actually allowed to run to completion.

## Fix (two parts)

### 1. Raise the pg_net timeout on both cron jobs

Recreate jobs 4 (`price-bounties-daily`) and 5 (`sync-drive-tasks-daily`) so `net.http_post` is called with `timeout_milliseconds := 300000` (5 min). This is a one-shot SQL insert via the Supabase insert path (contains the anon key, so it's runtime SQL, not a migration).

```sql
select cron.unschedule('sync-drive-tasks-daily');
select cron.schedule(
  'sync-drive-tasks-daily', '0 9 * * *',
  $$ select net.http_post(
       url := 'https://<ref>.supabase.co/functions/v1/sync-drive-tasks',
       headers := '{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
       body := '{}'::jsonb,
       timeout_milliseconds := 300000
     ); $$
);
-- same treatment for price-bounties-daily (safety margin, cheap)
```

### 2. Make `sync-drive-tasks` upsert BEFORE the og:image scrape

Even with a 5-min pg_net timeout, the function should never lose upserted rows to a slow scrape. Reorder in `supabase/functions/sync-drive-tasks/index.ts`:

1. Parse + map bounties
2. **Upsert all rows immediately** (as today, but earlier)
3. Then scrape og:image for rows missing one and run a second lightweight upsert to fill `og_image` only

This guarantees new bounties are recorded even if og scraping is slow or partially fails, and it makes any future timeout non-destructive.

Optional guardrails while we're in the file:
- Wrap the whole og-scrape section in a hard time budget (e.g. 90s) and skip the rest if exceeded.
- Log how many bounties were new vs updated after the first upsert so we can see growth without querying the DB.

### 3. Validate

- Manually invoke `sync-drive-tasks` once and confirm HTTP 200 with `{ ok:true, upserted:N }`.
- Manually invoke `price-bounties` after, confirm `platform_stats` updates.
- Check `tasks` `max(created_at)` moves past July 6 (if the Drive feed actually has new items).
- Check `net._http_response` for the next cron run shows `status_code: 200`, not a timeout.

## Non-goals

- No changes to the pill UI on `/` — it will start moving on its own once stats refresh.
- No changes to the Drive-side agent contract.
- No schema changes.
