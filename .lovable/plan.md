# Notifications Bell — Deep-link + Copy Update

## 1. Deep-link to @AskRei_ DM

X/Twitter deep-link options (this is an X platform limitation, not ours):

- `https://x.com/messages/compose?recipient_id={NUMERIC_ID}&text=/start` — opens the compose-DM screen with `/start` prefilled. **Requires the numeric Twitter user ID** of @AskRei_ (not the handle). Works on web and mobile X app.
- `https://x.com/AskRei_` — opens the profile only. No way to land directly in the DM thread or prefill text using just the handle.

There is no public X URL that accepts a handle AND prefills DM text. So:

- **If you can provide @AskRei_'s numeric user ID** (one-time lookup; you can grab it from tweeterid.com or any X API call), I'll hardcode it as `ASKREI_RECIPIENT_ID` in `NotificationsBellButton.tsx` and switch the CTA to the compose URL with `text=/start` prefilled.
- **If not**, the CTA stays pointed at `https://x.com/AskRei_` (profile), and the dropdown copy tells the user to hit the Message button and send `/start`.

I'll structure the component so swapping in the numeric ID later is a one-line change.

## 2. Dropdown copy update in `src/components/rei/NotificationsBellButton.tsx`

Replace the current headline + body block with:

- Headline (bold, same 13px size, `#f0ede8`):
  **Never Miss High Paying Crypto Bounties Again**

- Body paragraph (12px, `#a09e9a`):
  Opt-in to bounty notifications on X (Twitter) with the highest paying bounties weekly.

- Bulleted list below the paragraph (12px, `#a09e9a`, monospace inline for the commands):
  - DM her **`/start`** to get start notifications.
  - DM her **`/stop`** to stop notifications.

Styling: bullets rendered as a `<ul>` with `listStyle: disc`, `paddingLeft: 18px`, `marginTop: 8px`, tight `lineHeight: 1.5`. `/start` and `/stop` keep the existing monospace + lighter color treatment, wrapped in `<strong>`.

CTA button label stays `DM @AskRei_ on X`. Only the `href` changes if you provide the numeric ID.

## Out of scope
No backend, no opt-in storage, no cron — Hermes still handles all listening/state.
