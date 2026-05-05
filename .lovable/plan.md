## Goal

1. Add the blue verified checkmark icon next to the X handle inside the Sign Up / Sign In buttons on `/rei`.
2. Enforce that users must be following **@askrei_** on X before they can sign up or sign in.
3. Do this without burning SocialData API credits — use the Twitter OAuth session we already have.

---

## 1. Verified checkmark in the button

Copy the uploaded badge to `src/assets/x-verified-badge.svg` and import it into `src/pages/Rei.tsx`. Render it inline next to the text in both buttons (lines 311 and 321), e.g.:

```
Verify with X (Twitter) <img src={badge} className="h-4 w-4" />
@askrei_ <img src={badge} className="h-4 w-4" />
```

The badge will visually mirror the requirement ("follow the verified @askrei_ account").

---

## 2. Follow-gate without using SocialData

We already have a Twitter OAuth 2.0 user-context token in `supabase/functions/twitter-oauth/index.ts` after `exchangeToken`. Twitter's own v2 API can answer "does user X follow @askrei_" for free under that token — no SocialData call needed.

### Approach (cheapest path)

1. **Add OAuth scope `follows.read`** to the auth URL in `twitter-oauth/index.ts` (`getAuthUrl` action). Existing users will re-consent on next login.
2. **Resolve @askrei_'s user id once** and cache it as a Supabase function secret `ASKREI_X_USER_ID` (set manually after one-time lookup, or lazily fetched + memoized in module scope on cold start). This avoids a `users/by/username` call on every login.
3. **After `exchangeToken` succeeds**, before returning the user payload, call:
   `GET https://api.twitter.com/2/users/:source_id/following?user.fields=id&max_results=1000`
   with the user's bearer token, paginating with `pagination_token` until `askrei_`'s id is found or list ends.
   - For most users this is 1 request. Worst case (follows >1000), 2-3 requests.
   - Rate limit: 15 req / 15 min per user — well within budget for a login flow.
4. If not following → return `{ error: 'must_follow_askrei' }` with HTTP 403; frontend shows toast + keeps the user signed-out.
5. **Cache the positive result** in the existing `twitter_whitelist`-adjacent storage: add a small table `x_follow_checks (x_user_id pk, follows_askrei bool, checked_at timestamptz)` with a 7-day TTL. On subsequent logins within 7 days we skip the API call entirely. This is the key resource-saver.

### Frontend changes (`src/pages/Rei.tsx`)

In `handleTwitterCallback`, handle the new error case:
```ts
if (data?.error === 'must_follow_askrei') {
  toast({ title: 'Follow @askrei_ to continue',
          description: 'You must follow @askrei_ on X before signing in.',
          variant: 'destructive' });
  return;
}
```

Also update the Sign Up paragraph copy under the button to state the conditions:
> "By signing up you confirm you are following **@askrei_** on X and agree to our terms."

---

## 3. Files touched

- `src/assets/x-verified-badge.svg` (new — copied from upload)
- `src/pages/Rei.tsx` (badge in buttons, error toast, signup conditions copy)
- `supabase/functions/twitter-oauth/index.ts` (add `follows.read` scope, follow-check after token exchange, cache lookup)
- New migration: `x_follow_checks` table with RLS (service role only).

---

## 4. Resource cost summary

- **SocialData**: 0 calls — not used.
- **Twitter API**: 1 extra call per login, skipped entirely for 7 days after a positive check.
- **DB**: one tiny cache table.

No background jobs, no polling.
