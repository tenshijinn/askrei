## Prefill chat input from `?ask=` URL param

Enable shareable links like `rei.chat/ask?ask=find%20USDC%20bounties` (and `rei.chat/?ask=...`) that auto-populate the chat input. User just presses Send. No auto-submit.

### Behavior

- On page load, read `ask` from `URLSearchParams`, decode with `decodeURIComponent`, and set the chat input value.
- If missing/empty, do nothing — normal flow.
- Never auto-submit (logged-out and logged-in both prefill only for now).
- Works whether the link points at the public `/ask` page or the root `/` (root redirects to `/ask` preserving the param).
- Also supported on `/rei` chatbot for logged-in users so the same shareable links work post-login.

### Files to change

1. **`src/pages/Ask.tsx`**
   - In the existing mount `useEffect`, parse `window.location.search`, read `ask`, and if present call `setQuery(decoded)`. Leave `submitted=false` so the hero input stays centered — user reviews and clicks send.

2. **`src/pages/Index.tsx`** (landing at `/`)
   - On mount, if `?ask=` is present, `navigate('/ask?ask=' + encoded, { replace: true })` so the example URLs `rei.chat/?ask=...` resolve to the Ask page with the prefill intact.

3. **`src/components/ReiChatbot.tsx`** (logged-in `/rei` chat)
   - On mount, read `?ask=` and prefill the composer's input state. Do not send. Strip the param from the URL via `history.replaceState` after reading, so refreshes don't re-prefill over user typing.

### Technical notes

- Use `new URLSearchParams(window.location.search).get('ask')` + `decodeURIComponent`.
- Guard with `if (!raw) return;` — feature is inert when param is absent.
- No new dependencies, no backend changes, no rate-limit changes.
- Reusable by design: any future `?ask=<anything>` value works without code edits.

### Out of scope

- Auto-submit (kept as prefill-only per user decision).
- Analytics/attribution on the param (can be added later).