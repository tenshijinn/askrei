# Fix: whitelisted "team" users blocked at registration submit

## Root cause

The error is **directly related to ovdizzle being a team-whitelist user, not a true X-verified account**. The login (`twitter-oauth`) correctly bypasses the verified+follow gate for `verification_type = 'team'`, so he can sign in. But the registration submit step does a second, independent check that the bypass never reaches:

- `twitter-oauth` returns `verified: userData.data.verified` — the *raw* X blue-check value (false for ovdizzle). The whitelist bypass is exposed separately as `verified_account` / `bluechip_verified`.
- `src/pages/Rei.tsx` forwards only `verified: twitterUser.verified` (the raw false) to `submit-rei-registration`.
- `submit-rei-registration` enforces: `if (!reanalyze && !verified) return 403`.
- Result: 403 → frontend shows "Account update was unsuccessful. Edge Function returned a non-2xx status code."

So every team/whitelist user who isn't *also* an X-verified account hits this on a fresh registration. Reanalyze flows skip the check and work fine, which is why it only shows for new submits.

Confirmed: `twitter_whitelist` has `ovdizzle` as `team`, and `rei_registry` has no row for him yet.

## Fix

Make `submit-rei-registration` accept whitelisted users the same way login does, using the service role (RLS-safe, can't be spoofed by the client).

1. In `supabase/functions/submit-rei-registration/index.ts`, before the verified check, look up the handle in `twitter_whitelist`:
   ```
   isWhitelisted = exists row where ilike(twitter_handle, registrationData.handle)
   ```
2. Change the gate to: `if (!reanalyze && !verified && !isWhitelisted) → 403`.
3. Persist the whitelist signal on the registry row so downstream features can see it:
   - set `verified: true` on the upsert when `isWhitelisted` is true (or add a `whitelist_type` column later if we want to preserve the distinction — out of scope for this fix).

No frontend changes required. No schema migration required.

## Verification

- Curl `submit-rei-registration` with `{ handle: "ovdizzle", verified: false, ... }` → expect 200.
- Curl with a random non-whitelisted, non-verified handle → expect 403 (unchanged).
- Ask ovdizzle to retry registration end-to-end.

## Out of scope

- Reworking the OAuth response to send a single `is_allowed` flag (cleaner but touches more code).
- Adding `whitelist_type` to `rei_registry`.
