# Notifications Bell Button + Dropdown

UI-only addition next to the profile avatar tab button in `src/pages/Rei.tsx`. Hermes (the listening agent) handles opt-in/out state on its own by tracking follows + inbound `/start` and `/stop` DMs — no backend, no cron, no opt-in table needed in this app.

## What gets built

### 1. New component: `src/components/rei/NotificationsBellButton.tsx`
- Round button styled identically to the existing `rei-chip` profile button (same height, border, background, monospace, hover transition).
- Icon: `Bell` from `lucide-react`, 14px, color `#f0ede8`.
- Hover triggers a ringing animation via a CSS keyframe `rei-bell-ring` (rotates `0 → 14° → -12° → 10° → -8° → 6° → -4° → 0` over 700ms, `infinite` while `:hover`). Lean, no Lottie.
- Click toggles a dropdown panel; click-outside and Escape close it.
- Dropdown panel reuses tokens from `ReiEarningsHub` expanded panel:
  - `background: rgba(20,20,20,0.92)`, `backdropFilter: blur(12px)`, `border: 0.5px solid hsla(0,0%,100%,0.08)`, `borderRadius: 20px`, `slideDown 0.2s ease-out`, monospace headers, `#5c5a57` muted text, `#f0ede8` body text.
- Dropdown content:
  - Eyebrow: `BOUNTY NOTIFICATIONS`
  - Headline: `Never miss the highest paying bounties in crypto.`
  - Body: `Opt-in to bounty notifications on X (Twitter). DM Rei with /start to get the top 3 paying bounties every Sunday. Send /stop anytime to unsubscribe.`
  - Primary CTA (`btn-manga btn-manga-primary` styling): `DM @AskRei_ on X` with Twitter icon, opens `https://x.com/AskRei_` in a new tab (`target="_blank" rel="noopener"`).

### 2. Wire into `src/pages/Rei.tsx`
- Render `<NotificationsBellButton />` immediately before the profile tab button (`data-tour="profile"`), in the same flex row, inheriting the row's gap spacing.

## Out of scope (handled by Hermes, not this app)
- Inbound `/start` / `/stop` DM listening, opt-in state storage, follow-state tracking, weekly top-3 bounty cron, numeric recipient_id lookup.