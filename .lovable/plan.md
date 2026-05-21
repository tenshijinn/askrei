# Fix: zernio-events returning Unauthorized

## Diagnosis

The agent reports every auth attempt to `https://qajahmmzqhgboeoorfqj.supabase.co/functions/v1/zernio-events` returns `{"error":"Unauthorized"}`.

Current behavior in the code:
- `zernio-events/index.ts` accepts the secret via `x-webhook-secret`, `x-zernio-signature`, `Authorization: Bearer <secret>`, or `?secret=`.
- On failure it returns 401 **silently** (no log line), so the edge function logs only show boot/shutdown — we can't tell from logs whether the request even reached our code or what header was sent.
- `zernio-webhook` (sister function) is clearly being reached: logs show `[zernio-webhook] Invalid secret`.
- `supabase/config.toml` has `[functions.zernio-events] verify_jwt = false`, but if the function hasn't been redeployed since that line was added, Supabase's platform layer will 401 the request before our code runs.

## Fix

1. **Add debug logging** to `zernio-events` so every auth failure logs which header was present (name only, never the value) and the request method/path. This makes the next failed call from Hermes immediately diagnosable.

2. **Force a redeploy** by touching the function file (any code change does this), so the latest `verify_jwt = false` config takes effect.

3. **Tighten the auth path** — keep all 4 accepted carriers (`x-webhook-secret`, `x-zernio-signature`, `Authorization: Bearer`, `?secret=`) but also accept `x-api-key` since some agent frameworks default to it. Still timing-safe compared against `ZERNIO_WEBHOOK_SECRET`.

4. **Add a tiny unauthenticated `GET /health`** path that returns `{ ok: true, ts: ... }` with no auth required. This lets the agent prove the function itself is reachable independently of the secret, isolating "platform 401" vs "wrong secret".

5. **Test from our side** with `supabase--curl_edge_functions` using the stored `ZERNIO_WEBHOOK_SECRET` to confirm the deployed function accepts the documented header. Report the result back so Hermes knows the expected exact header.

## Tell Hermes

After the fix, Hermes should:
- First call `GET /functions/v1/zernio-events/health` (no auth). If this 200s, the function is reachable.
- Then call `GET /functions/v1/zernio-events?unprocessed=true&limit=10` with header `x-webhook-secret: <ZERNIO_WEBHOOK_SECRET>`. Do **not** send the Supabase anon key, do **not** send `apikey` header, do **not** wrap the secret in `Bearer` unless using the `Authorization` header.
- If still 401, check our edge function logs — the new debug line will show exactly which header arrived.

## Files touched

- `supabase/functions/zernio-events/index.ts` — add logging, `/health` route, accept `x-api-key`.
- No DB migration, no config.toml change needed (already correct).
