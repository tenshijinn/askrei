## Goal
Pull a JSON bounty feed from your Google Drive every 3 days and upsert each bounty into the existing `tasks` table so they show up in Rei's feed alongside everything else.

## JSON shape (from your sample)
```json
{
  "generated_at": "...",
  "bounties": [
    { "id", "platform", "title", "description", "reward": {amount, currency, type},
      "deadline", "skills": [], "url", "sponsor", "posted_at", "fetched_at" }
  ]
}
```

## Field mapping → `tasks`
| Source | → | `tasks` column |
|---|---|---|
| `id` (e.g. `superteam-71d3...`) | → | `external_id` (dedupe key for upsert) |
| `title` | → | `title` |
| `description` ?? `"<sponsor> bounty on <platform>"` | → | `description` (NOT NULL fallback) |
| `reward.amount` + `reward.currency` (e.g. `"10000 USDC"`) | → | `compensation` |
| `url` | → | `link` |
| `deadline` | → | `end_date` |
| `sponsor` | → | `company_name` |
| `[platform]` | → | `role_tags` (until we add real skills) |
| `"gdrive-aggregator"` | → | `source` |
| `"gdrive:<file_id>"` | → | `payment_tx_signature` (mirrors `sync-campaign-tasks` pattern to satisfy NOT NULL) |
| `"gdrive:aggregator"` | → | `employer_wallet` (NOT NULL placeholder) |
| `"task"` | → | `opportunity_type` |
| `"active"` | → | `status` |

## Architecture

```text
[Google Drive: bounty-feed.json]
        │  (Lovable Google Drive connector — your account)
        ▼
[Edge Function: sync-drive-tasks]
        │  download → parse bounties[] → map → UPSERT (on external_id)
        ▼
[public.tasks]  source = 'gdrive-aggregator'
        │
        ▼
[public-feed / Rei UI / Agent API]

[pg_cron every 3 days at 09:00 UTC] ──► sync-drive-tasks
```

## Steps

1. **Connect Google Drive** via the Lovable connector (one-time auth with your account).

2. **Add secret** `DRIVE_TASKS_FILE_ID` — the file ID from the Drive share URL (between `/file/d/` and the next `/`).

3. **Create edge function** `supabase/functions/sync-drive-tasks/index.ts`
   - Downloads via `https://connector-gateway.lovable.dev/google_drive/drive/v3/files/{file_id}?alt=media` using `LOVABLE_API_KEY` + `GOOGLE_DRIVE_API_KEY` headers.
   - Validates payload with Zod (`bounties` must be an array; each item needs `id`, `title`, `url`).
   - Maps each bounty per the table above.
   - **Upserts** with `supabase.from('tasks').upsert(rows, { onConflict: 'external_id' })` — updates title/description/compensation/end_date/role_tags/company_name on existing rows, inserts new ones.
   - Returns `{ fetched, inserted_or_updated, skipped, errors }`.
   - Accepts manual POST with optional `{ file_id }` override for ad-hoc refreshes.
   - `verify_jwt = false` so cron + manual triggers work.

4. **Ensure unique index on `tasks.external_id`** (required for `onConflict` upsert) — schema migration if not already present.

5. **Schedule via pg_cron** (every 3 days, 09:00 UTC):
   ```sql
   select cron.schedule('sync-drive-tasks-3d', '0 9 */3 * *', $$
     select net.http_post(
       url := 'https://qajahmmzqhgboeoorfqj.supabase.co/functions/v1/sync-drive-tasks',
       headers := '{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
       body := '{}'::jsonb
     );
   $$);
   ```
   Inserted via the data tool (not migrations) since it embeds project URL + key. Enables `pg_cron` + `pg_net` first if not already on.

6. **Light extension points** (handled in the same function, no extra steps):
   - When `platforms_pending` graduates to `platforms_included` (zealy, questn, taskon, layer3, galxe), the same mapper handles them — no code change needed as long as fields stay the same.
   - `description: null` is handled with a generated fallback string.
   - `skills: []` becomes empty `role_tags`; we tag `platform` so feed filters still work.

## What you'll need to do
- Approve this plan.
- After Drive connector prompt appears, click through it once.
- Paste the Google Drive **file ID** when I request the `DRIVE_TASKS_FILE_ID` secret.

## Out of scope (can add later if you want)
- Auto-expire bounties that disappear from the JSON.
- Mapping `skills` → `skill_category_ids` once Superteam starts populating that field.
- A `/admin` button to trigger an immediate sync.
