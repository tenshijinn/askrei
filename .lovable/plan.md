## Problem

`ScrollVideoHero`'s Latest Bounty card shows "1 $USDC · 1d ago" because:

1. `sync-drive-tasks` inserts the entire Drive batch with a single `created_at` timestamp, so every bounty in the last run is tied for "newest".
2. Ordering by `created_at desc` alone returns an arbitrary row from that tie — currently a $1 USDC entry.
3. The relative timestamp reflects the last sync run (~1d), not a real posting time — and it will keep saying "1d ago" until the next daily cron.

## Fix

Edit only `src/components/joinrei/ScrollVideoHero.tsx` — data + display, no backend changes.

### 1. Pick a meaningful "latest" row

Update `useLatestBounty` query to:

- Fetch the top ~50 rows by `created_at desc` from `v_public_tasks`.
- Filter out rows with null/empty `compensation`.
- Among the newest batch (rows sharing the max `created_at`), pick the one with the highest parsed USD-equivalent amount. Fallback to the first parseable row if none can be priced.

This keeps "latest" honest (still from the most recent ingest) while surfacing a headline-worthy number instead of a $1 tie-break.

### 2. Timestamp label

Since batch `created_at` isn't a true posting time, relabel the footer from `added Xago` to `synced Xago` so it accurately reflects that this is the last ingest run, not per-bounty posting time. Keep the same `formatRelativeTime` helper.

### 3. Refresh cadence

Leave the hourly refetch as-is.

## Out of scope

- Backend / `sync-drive-tasks` changes to stamp per-bounty timestamps.
- Any other hero elements (ticker, pills, CTAs, stats).
