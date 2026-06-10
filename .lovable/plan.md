# Notifications Bell Button + Dropdown

Scope: UI-only addition next to the profile avatar tab button in `src/pages/Rei.tsx`. No backend/cron in this change — the weekly DM dispatch from Hermes is out of scope and can be wired up after the opt-in UX ships.

## What gets built

### 1. New component: `src/components/rei/NotificationsBellButton.tsx`
- A small round button styled identically to the existing `rei-chip` button used by the profile tab (same height, border, background, monospace, hover transition).
- Icon: `Bell` from `lucide-react`, sized 14px, color `#f0ede8`.
- Hover state triggers a "ringing" animation:
  - CSS keyframe `rei-bell-ring` defined locally (or in `src/index.css`): rotates the icon `0 → 14° → -12° → 10° → -8° → 6° → -4° → 0` over 700ms, repeated on hover via `:hover svg { animation: rei-bell-ring 700ms ease-in-out infinite; }`. Lean, no Lottie needed.
- Click toggles an open/closed state for the dropdown panel.
- Dropdown panel:
  - Absolutely positioned under the bell, right-aligned-ish to fit on mobile.
  - Reuses exact visual tokens from `ReiEarningsHub` expanded panel: `background: rgba(20,20,20,0.92)`, `backdropFilter: blur(12px)`, `border: 0.5px solid hsla(0,0%,100%,0.08)`, `borderRadius: 20px`, `slideDown 0.2s ease-out` animation, monospace headers, `#5c5a57` muted text, `#f0ede8` body text.
  - Content:
    - Small uppercase eyebrow: `BOUNTY NOTIFICATIONS`.
    - Headline (body): `Never miss the highest paying bounties in crypto.`
    - Sub copy: `Opt-in to bounty notifications on X (Twitter). DM Rei with "Start" to get the top 3 paying bounties every Sunday.`
    - Primary CTA button (`btn-manga btn-manga-primary` style): `DM @AskRei_ on X` with a Twitter icon. Opens `https://twitter.com/messages/compose?recipient_id=...` (or fallback `https://x.com/messages/compose?recipient_id=AskRei_`). Best supported URL: `https://twitter.com/messages/compose?recipient_id=<AskRei_ numeric id>` — since we don't have the numeric id yet, use `https://x.com/AskRei_` as the navigation target so the user lands on the profile and can hit "Message". Open in new tab via `target="_blank" rel="noopener"`.
  - Click-outside / Escape closes the panel (mousedown listener on document, same pattern as existing dropdowns).

### 2. Wire into `src/pages/Rei.tsx`
- Locate the profile tab button (search anchor: `data-tour="profile"`).
- Render `<NotificationsBellButton />` immediately before it inside the same flex row so it sits to the left of the avatar chip, with the same `gap` spacing already in that row.
- No prop drilling needed — component is self-contained.

## Out of scope (flag for follow-up)
- Backend listener for inbound `Start` DM from @AskRei_.
- Storing opt-in state per `x_user_id`.
- Weekly cron that picks top-3 paying bounties and sends DMs via the Hermes agent.
- Numeric Twitter recipient_id lookup for deep-link `compose` URL.

Confirm and I'll implement step 1 + 2 only.
