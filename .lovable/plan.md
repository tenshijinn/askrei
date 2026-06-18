# Redesign post-OAuth signup as "Activate your Rei profile"

After Twitter OAuth returns successfully, replace the existing Sign Up / Sign In card with a new `ActivateReiProfileCard` that walks the user through 3 steps with calm, momentum-driven copy and an animated progress bar.

## Visual design (matches attached reference)

- Card title: `Activate your Rei profile` with the Rei sparkle mark
- Subtitle: `A few quick steps to unlock your Proof-of-Talent experience.`
- Vertical step list with numbered/checked circles connected by a thin vertical line
- Right side of each row holds the active control (Follow button, spinner, or checkmark)
- Bottom: blocky segmented progress bar with `%` label, matching the reference (peach-filled cells on a muted track)
- Footer link: `Already have an account? Sign in` (only in sign-up mode)
- Uses existing tokens (`#ed565a` accent, `rei-surface-*`, peach `#e8c4b8`). No new colors.

## Three steps

1. **Verified X account** — pre-completed on mount (OAuth just confirmed it). Status text: `Done`.
2. **Follow @askrei_ on X** — active. Subtext: `Stay connected for updates and announcements.` Right side: small `[𝕏 Follow]` button.
3. **Unlock your portal** — pending. Subtext: `Pending` → `Unlocking…` → `Ready`.

Progress: step 1 = 33%, step 2 active = 66%, step 3 active = 83%, complete = 100%.

## Interaction flow

1. OAuth callback succeeds (verified=true) → set `twitterUser`, render `ActivateReiProfileCard` instead of the auth card. Step 1 already ✓, step 2 active.
2. User clicks `𝕏 Follow`:
   - Opens `https://x.com/intent/follow?screen_name=AskRei_` in a new tab (`window.open` with `noopener`).
   - Immediately swap the button for a `Checking…` pill with a spinner.
   - Start polling.
3. Polling: every 1500 ms call a new lightweight edge action `twitter-oauth { action: 'checkFollow', x_user_id }` that bypasses cache and queries SocialData. Stop after success or ~60s timeout.
4. On success:
   - Step 2 → ✓ `Connected`, progress 83%, step 3 becomes active with `Unlocking…` spinner.
   - After ~1.2s delay (purely cosmetic), step 3 → ✓ `Unlocked`, progress 100%, bottom text `Redirecting…`.
   - After ~600ms, advance the existing signup flow (set `step` so the user lands on the wallet/profile screen exactly as today).
5. On 60s timeout: keep card in checking state, show subtle muted text `Still waiting… make sure you followed @AskRei_` with a quiet "Check again" link. No destructive toasts, no "verification failed" language.

## Copy rules

- Remove all "Requirements", "Access denied", "Verification failed", "Follow to continue" toast/text.
- All toasts during this flow are removed (silent, non-disruptive). One success toast on completion: `Profile activated`.

## Code changes

- **New** `src/components/rei/ActivateReiProfileCard.tsx` — self-contained card. Props: `handle`, `onComplete()`. Internally handles the follow click, polling, and step state.
- **Edit** `src/pages/Rei.tsx`:
  - When `twitterUser && !isSuccess && !registrationData` (and we're in the post-OAuth pre-wallet stage), render `ActivateReiProfileCard` instead of the current Sign Up / Sign In card with `FollowChecklist`.
  - Remove the now-unused `FollowChecklist` block in that branch; keep `ChecklistRow` only if still referenced elsewhere (otherwise delete).
  - Strip the `Follow @askrei_ to continue` / `Verified Account Required` toasts from `handleTwitterCallback`. Verified-check failure still bails (rare), but with a single neutral toast `Verified X account required`.
  - `onComplete` from the card advances to the existing wallet step.
- **Edit** `supabase/functions/twitter-oauth/index.ts`:
  - Add a new `action: 'checkFollow'` branch that takes `{ x_user_id }`, calls `checkFollowsAskrei` with `forceFresh = true` (skip cache read but still write on success), returns `{ follows_askrei: boolean }`. No auth token required since SocialData call doesn't need user context.
  - Refactor `checkFollowsAskrei` to accept an optional `forceFresh` flag.

## Technical notes

- Polling lives inside the card component using `setInterval` cleared on unmount, on success, and on timeout.
- The "1-click follow" is implemented as an X intent popup + polling — true write-API follow is not feasible on the current OAuth scopes / X API tier. The UX is indistinguishable from one-click in practice.
- No DB schema changes. No new env vars.
- No changes to sign-in (existing-account) path; that path bypasses the activate card and goes straight to the dashboard as today.
