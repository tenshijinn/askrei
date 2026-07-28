Apply Rei's dark manga/terminal aesthetic to the /ask page while keeping the exact current layout (input starts centered in the hero, then drops to a fixed bottom composer after submission).

Current /ask uses generic black/white styling: pure black background, white circular send button, rounded white/grey bubbles, and standard sans-serif type. The /rei chatbot (`ReiChatbot.tsx`) uses the established `rei-terminal` palette: `#0f0f0f` surfaces, `#f0ede8` cream text, `#e8c4b8` warm accent, `#b8b5b0` assistant text, `#5c5a57`/`#4a4845` muted tones, `SF Mono`/`Consolas` for inputs, and `rei-surface-2`/`rei-chip`/`send-btn` primitives.

Changes to make in `src/pages/Ask.tsx`:

1. **Page background** — switch from `bg-black` to the terminal surface color (`#0a0a0a`/`#0f0f0f`) used in `rei-terminal`.
2. **Header** — restyle the top bar to match the `term-bar` look: darker background, subtle border-bottom, muted logo text, and a `rei-chip`/`btn-manga-outline` style sign-up button instead of the current white-bordered secondary button.
3. **Hero input** — replace the white/rounded-full pill with the terminal composer style: dark input wrap (`#141414`) with the warm accent border (`hsla(18,52%,82%,0.22)`), a prompt prefix like `@ask >`, monospace font, caret-color accent, and a `send-btn` pill instead of the white circle icon. Keep the input centered below the title and icon.
4. **Hero title/subtitle** — preserve positioning, but tint the title `hsl(30,10%,93%)` and subtitle the muted `#5c5a57` to fit the terminal palette.
5. **User bubble** — after submission, replace the rounded grey bubble with `rei-surface-2` styling (subtle border, `#1e1e1e` background) and the warm accent handle color for the user.
6. **Assistant reply** — replace the plain white/90 text with the terminal message palette: muted `#b8b5b0` body and `#f0ede8` headings. Add a lightweight `chat-line`-style header (e.g. `[@rei]` + timestamp) consistent with /rei, without adding a full log window.
7. **Loading state** — replace the generic `Loader2`/`white/60` text with the /rei terminal style: `@rei` handle, `thinking…` in muted `#4a4845`, and spinner in `#7a7874`.
8. **Bounty card** — restyle the result card to use `rei-surface-2` background/border, warm accent for the compensation pill, and muted `#a09e9a`/`#5c5a57` for secondary text. Keep the card layout unchanged.
9. **Bottom composer (post-submit)** — use the same terminal input style as the hero, just in the fixed bottom position. Keep the existing gradient fade and the sign-up hint below it, but tint the hint text to the muted terminal color and use the accent for the link.
10. **Empty-state footer hint** — match the muted terminal color and accent link styling.

No template/position changes: the input remains centered in the hero before submit and fixed at the bottom after submit. No new backend logic, no AI SDK change, no route or rate-limit change.

Verification: run the project typecheck/build, then load `/ask` in the preview and confirm the page colors, input, messages, and bounty card visually match the /rei chatbot terminal aesthetic.