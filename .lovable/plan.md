# First-Time User Walkthrough

Add an interactive coach-mark tour that auto-starts the first time a user reaches the logged-in `/rei` view (after X login + wallet connect + registration). Returning users do not see it again. They can skip at any time, replay later from the profile menu.

## UX

Five-step spotlight tour using floating tooltip cards anchored to real UI elements. Each step dims the rest of the page, highlights one target with a soft ring (`#ed565a`), and shows a small card with: step counter (1/5), title, 1–2 sentence description, "Skip tour" link, "Back"/"Next" buttons. Final step uses "Done".

Steps target the existing logged-in chrome on `/rei`:

1. **AskRei tab** — "Chat with Rei to find bounties, gigs, and tasks matched to your skills."
2. **Promote tab** — "Submit a campaign or opportunity for Rei to match to the right contributors ($5 SOL)."
3. **Profile button** (top-right avatar) — "Edit your transcript, roles, and wallet anytime here."
4. **Earnings hub** (top bar `ReiEarningsHub`) — "Track points, payouts, and NFT rewards from completed work."
5. **Logout** — "Sign out securely. Your X identity and wallet stay linked."

Behavior:
- Auto-starts ~600ms after the logged-in view mounts for first-timers.
- Scrolls target into view; repositions on resize.
- `Esc` and outside-click on the backdrop = skip.
- Skipping or completing both mark the tour as seen.
- A "Replay walkthrough" item is added to the profile tab (or a small `?` button next to Logout) so users can re-trigger it.

## Persistence

Per-user flag stored in `localStorage` keyed by X user id:
`rei_walkthrough_completed:<x_user_id> = "true"`.

No DB changes — keeps it lightweight and avoids RLS work. (If cross-device persistence is wanted later, we can add a `walkthrough_completed_at` column to the registration row; out of scope for v1.)

## Technical details

- New component `src/components/joinrei/WalkthroughTour.tsx`:
  - Props: `steps: { selector: string; title: string; body: string; placement?: 'bottom'|'top'|'left'|'right' }[]`, `open`, `onClose`, `storageKey`.
  - Uses `getBoundingClientRect()` on the target + a fixed-position overlay with an SVG mask (or 4 dimmed divs around the target rect) to create the spotlight.
  - Tooltip card uses existing `rei-surface` / `btn-manga` styling so it matches the manga terminal aesthetic (accent `#ed565a`).
  - Re-measures on `resize`, `scroll`, and step change. Falls back gracefully if a target is missing (skips that step).
- New hook `src/hooks/useFirstTimeWalkthrough.ts`:
  - Reads `rei_walkthrough_completed:<id>` from `localStorage`.
  - Exposes `{ shouldShow, markSeen, replay }`.
- Wire-up in `src/pages/Rei.tsx`:
  - Add `data-tour="askrei" | "promote" | "profile" | "earnings" | "logout"` attributes on the existing buttons in the logged-in header/tabs (no visual change).
  - Mount `<WalkthroughTour>` inside the `isSuccess && registrationData && !isEditMode` branch, gated by the hook.
  - Add a small "Replay walkthrough" trigger (text button) in the profile tab area.
- No new dependencies. No backend changes. No design-token changes — reuse existing `rei-surface`, `btn-manga`, `btn-manga-primary`, and accent color.

## Out of scope

- Multi-page tours (only the `/rei` logged-in view).
- Server-side persistence / analytics events for tour progress.
- Walkthroughs for `/`, `/joinrei`, `/agents`.
