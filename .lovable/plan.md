# Registration walkthrough + edit-profile wallet bug

Two things:

1. Add a small, scoped walkthrough for first-time users on the signup screen, sharing content with the post-signup tour so they never drift out of sync.
2. Fix the "Edit Profile → wallet button does nothing" issue.

---

## 1. Shared walkthrough content

### Problem
The current tour only runs after registration succeeds. We want a second, smaller tour that runs *during* signup, but its card copy should always match the equivalent step in the logged-in tour — so editing one place updates both.

### Approach: one source of truth for step copy

Create `src/components/joinrei/walkthroughContent.tsx`. This is a plain TS module that exports the titles + body JSX for every conceptual step that exists in both flows. Examples:

```ts
export const walkthroughCopy = {
  voiceIntro:   { title: 'Record your voice intro', body: <>...</> },
  roleTags:     { title: 'Pick your role tags',     body: <>...</> },
  portfolio:    { title: 'Add a portfolio link',    body: <>...</> },
  wallet:       { title: 'Connect your wallet',     body: <>...</> },
  submit:       { title: 'Submit your details',     body: <>...</> },
  reanalyze:    { title: 'Re-analyze your profile', body: <>...</> }, // edit-only
};
```

Both tours import from this file. The post-signup "Edit profile" step and the registration-screen steps reference the same `walkthroughCopy.*` entries, so a copy change ripples to both automatically.

### Registration tour

- New hook `useRegistrationWalkthrough` modeled on `useFirstTimeWalkthrough` but with its own localStorage key (`rei_registration_walkthrough_completed:<x_user_id>`), gated on `twitterUser?.x_user_id && !isSuccess` (only fires for signed-in-to-X but not-yet-registered users).
- Mount a second `<WalkthroughTour>` inside the LOGIN / REGISTRATION VIEW branch of `Rei.tsx` (around line 472), with steps pointing only at elements that exist on that screen:
  - `[data-tour="reg-voice"]` → AudioRecorder block
  - `[data-tour="reg-portfolio"]` → portfolio URL input
  - `[data-tour="reg-roles"]` → role tag chips
  - `[data-tour="reg-wallet"]` → WalletMultiButton
  - `[data-tour="reg-submit"]` → Submit/Register button
- Add the matching `data-tour` attributes to those elements in `Rei.tsx` (lines 526, 544–547, 550).
- Because `WalkthroughTour`'s Next button is spotlight-only (no router pushes), there's zero risk of the user being moved into protected post-registration UI.

### Logged-in tour
- Replace the inline JSX in the existing "Edit profile" / "Profile card" steps with references to `walkthroughCopy`, so they share the registration copy where it overlaps.

---

## 2. Edit Profile wallet bug

### Symptom
After clicking **Edit Profile**, the user lands on what looks like the login page, the Twitter session is fine, but clicking the wallet button does nothing.

### Likely cause
`isEditMode = true` re-renders the registration view (`Rei.tsx` line 264 guard flips to false). That view shows:
- Step 1: Twitter (already done, shown collapsed) ✅
- Step 2: `WalletMultiButton` — only enabled if `twitterUser && !connected`.

If the wallet adapter's `connected` state is `false` at this moment (Solana wallet auto-connect didn't re-hydrate), the user sees the connect button. The "nothing happens" is most likely one of:

a. The Solana `WalletModalProvider` is mounted in a parent that unmounts/remounts on the view switch, so the modal opens off-screen or never mounts.
b. A z-index conflict — modal opens behind the page.
c. Twitter callback handler is interfering, or `WalletMultiButton` click is being swallowed by an overlay.

### Investigation steps (during build)
1. Check where `WalletProvider`/`WalletModalProvider` is mounted (`src/components/WalletProvider.tsx`, `App.tsx`) — confirm it wraps both views consistently.
2. Add a console log to `WalletMultiButton`'s wrapper or use the wallet adapter's `setVisible` hook directly to confirm the modal opens.
3. Check for fixed-position overlays in edit view (the in-progress walkthrough or any leftover backdrop) that might intercept clicks.

### Fix
Most likely we need to ensure that on `Edit Profile` click, we don't actually need the user to re-connect: `registrationData.wallet_address` is already known. Two options:

- **Option A (preferred):** Skip the wallet step in edit mode. Treat the stored `wallet_address` as authoritative, only show the WalletMultiButton if the user explicitly wants to change wallets (a "Change wallet" link). The Update Profile call already accepts the wallet address as a string.
- **Option B:** Keep the current flow but fix the modal mounting so clicking actually opens it.

Plan implements **Option A**, plus a small "Change wallet" affordance, and as a side-effect also fixes the "nothing happens" symptom because no modal is required to proceed.

---

## Files touched

- `src/components/joinrei/walkthroughContent.tsx` (new)
- `src/hooks/useRegistrationWalkthrough.ts` (new, mirrors `useFirstTimeWalkthrough`)
- `src/pages/Rei.tsx` — add `data-tour` attrs on registration view, mount second tour, refactor edit-mode wallet step, import shared copy
- (Logged-in tour steps already in `Rei.tsx` get refactored to use `walkthroughCopy`)

No backend, schema, or RLS changes.
