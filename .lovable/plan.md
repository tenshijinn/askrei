## Goal

Reflect the actual UX flow on `/rei`:

1. The buttons should read **"Sign up with [badge]Twitter"** and **"Sign in with [badge]Twitter"** (badge inline between "with" and "Twitter").
2. While the OAuth callback runs, show a small panel under the button with **two pending checkboxes** that flip to checked / failed in order:
   - `Checking for Verified Twitter`
   - `Checking Follows @askrei_`

## 1. Button copy + badge placement (`src/pages/Rei.tsx`)

Replace the current "Verify with @askrei_" / "Sign in with @askrei_" labels:

```
<Twitter /> Sign up with <img src={xVerifiedBadge} /> Twitter
<Twitter /> Sign in with <img src={xVerifiedBadge} /> Twitter
```

The badge sits between "with" and "Twitter" so it visually reads "verified Twitter".

Update the helper paragraph beneath each button to:

> "You must have a **Verified** X (Twitter) account and be following **@askrei_** to continue."

## 2. Two-step checklist UI

Add local state in `Rei.tsx`:

```ts
type CheckState = 'idle' | 'pending' | 'ok' | 'fail';
const [verifiedCheck, setVerifiedCheck] = useState<CheckState>('idle');
const [followCheck, setFollowCheck]     = useState<CheckState>('idle');
```

Render under the button whenever `isProcessingCallback` is true OR either check is non-idle:

```
[ ] Checking for Verified Twitter   ← spinner while pending, ✓ green / ✕ red after
[ ] Checking Follows @askrei_
```

Use `Loader2` (animate-spin) for pending, `Check` (green) for ok, `X` (red) for fail — all from `lucide-react`. Style with existing `rei-chip` look.

State transitions inside `handleTwitterCallback`:

1. Before invoking the function: `setVerifiedCheck('pending'); setFollowCheck('pending')`.
2. On response, inspect new structured payload from edge function:
   - `verified: boolean`
   - `follows_askrei: boolean`
3. Map to UI:
   - verified true → `ok`, else `fail` and stop (toast: "Your X account must be Verified.")
   - follows true → `ok`, else `fail` (toast: "You must follow @askrei_ on X.")
4. On success, both `ok` for ~600ms, then continue to step 2 of registration.
5. On any failure, leave the row visible so the user understands which check failed; reset on next button click.

## 3. Edge-function response shape (`supabase/functions/twitter-oauth/index.ts`)

The function already fetches `verified` and runs `checkFollowsAskrei`. Change the flow so it always returns both flags (instead of short-circuiting with HTTP 403 on follow failure), so the UI can render ordered failures cleanly:

```ts
const isVerifiedAccount = userData.data.verified === true
                       || (userData.data as any).verified_type
                          && (userData.data as any).verified_type !== 'none';

let followsAskrei = false;
if (isVerifiedAccount && !skipWhitelistCheck) {
  followsAskrei = await checkFollowsAskrei(...);
}

return new Response(JSON.stringify({
  user: {...},                       // only used by frontend if both checks pass
  verified_account: isVerifiedAccount,
  follows_askrei: followsAskrei || skipWhitelistCheck,
  bluechip_verified: isVerified,
}), { status: 200, headers: ... });
```

Frontend treats the login as successful only when `verified_account && follows_askrei`. This keeps the existing 7-day cache (`x_follow_checks`) and SocialData-free model intact, and skips the follow API call entirely if the user isn't verified — which actually saves resources.

## 4. Files touched

- `src/pages/Rei.tsx` — button copy/badge position, two-row checklist UI, updated `handleTwitterCallback` logic.
- `supabase/functions/twitter-oauth/index.ts` — return both flags instead of 403 on follow failure; gate follow API call on `verified_account`.

## 5. Resource impact

- Verified check: zero new API calls (already in `users/me` response).
- Follow check: now skipped entirely for unverified accounts → fewer Twitter API calls than today.
- Cache TTL: unchanged (7 days).
