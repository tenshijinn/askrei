# Hermes ↔ Rei: Event Fetch API

Hermes needs a way to pull `zernio_webhook_events` from Rei. Plan: add a second edge function (`zernio-events`) that Hermes polls, plus a small DB helper for clean extraction. Keep the existing `zernio-webhook` ingest endpoint unchanged.

## What gets built

1. **Edge function `zernio-events`** (`verify_jwt = false`, secret-auth)
   - `GET /functions/v1/zernio-events?since=<ISO timestamp>&limit=100&event_type=comment.received&unprocessed=true`
   - Auth: same `ZERNIO_WEBHOOK_SECRET` via `x-webhook-secret` header (or `Authorization: Bearer <secret>`, or `?secret=`)
   - Returns normalized rows + a `next_since` cursor for the next poll
   - `POST /functions/v1/zernio-events/ack` with `{ ids: [...], error?: string }` to mark events `processed = true` (or set `processing_error`)

2. **DB helper view `public.zernio_webhook_events_normalized`**
   - Pulls common fields out of `payload` JSONB so Hermes does not have to guess shapes:
     - `comment_text` ← `payload.text` / `payload.body` / `payload.data.text` / `payload.data.body`
     - `author_handle` ← existing `x_handle` fallback to `payload.author.username` etc.
     - `author_user_id` ← existing `x_user_id` fallback chain
     - `in_reply_to_tweet_id` ← `payload.in_reply_to_status_id_str` / `payload.data.tweet_id` / `payload.postId` / `payload.object_id`
     - `event_external_id` ← existing `external_id`
   - Read by service role only (function uses service role key)

3. **Index** on `(received_at, event_type) WHERE processed = false` for fast polling.

## Answers for Hermes

1. **Fetch method:** Poll `GET /functions/v1/zernio-events?since=<ts>`. Realtime is available as an option but polling every 2–5 min is the recommended default.
2. **Auth:** Same `ZERNIO_WEBHOOK_SECRET`, sent as `x-webhook-secret` header (or `Authorization: Bearer`). No Supabase anon/service key needed — the function holds the service role internally.
3. **Event structure (response):**
   ```json
   {
     "events": [
       {
         "id": "uuid",
         "event_external_id": "1234567890",
         "event_type": "comment.received",
         "received_at": "2026-05-21T18:30:00Z",
         "author_handle": "someuser",
         "author_user_id": "987654",
         "in_reply_to_tweet_id": "1111111111",
         "comment_text": "great post!",
         "payload": { /* full original */ }
       }
     ],
     "next_since": "2026-05-21T18:30:00Z",
     "count": 1
   }
   ```
   Dedupe on `id` (UUID) or `event_external_id`.
4. **Helpers:** The `zernio_webhook_events_normalized` view does the extraction. Also `POST /ack` to flip `processed = true` so Hermes does not re-handle events.
5. **Rate limits:** No app-level limits; Supabase edge functions handle the load. Poll every 2–5 min, `limit ≤ 500` per call. Use `unprocessed=true` to keep payloads small.
6. **Test event:** After deploy, you (or I) can `POST` a sample `comment.received` payload to `zernio-webhook` and then `GET` it back through `zernio-events` to confirm the shape.

## Technical details

- New file: `supabase/functions/zernio-events/index.ts` (handles `GET /` and `POST /ack`, shares the `timingSafeEqual` secret check pattern from `zernio-webhook`).
- New migration: create view + index, grant select on view to `service_role`.
- `supabase/config.toml`: add `[functions.zernio-events]` with `verify_jwt = false`.
- No changes to existing `zernio-webhook` function or `zernio_webhook_events` table schema.
