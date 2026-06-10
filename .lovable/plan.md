# Fix: empty space above streamed bounty cards in AskRei chat

## Cause
In `src/components/chat/MessageContent.tsx`, hidden `[[rei-task:UUID]]` markers are removed from the displayed text, but the surrounding newlines/spaces stay. When the model emits each marker on its own line (which is the common case for multiple bounties), stripping the tokens leaves a stack of blank lines between the prose and the rendered `TaskPreviewCard`s — visible as the large empty gap in the recording.

## Change (single file)
`src/components/chat/MessageContent.tsx` — improve the cleanup pass that runs after markers are collected:

1. When stripping a marker, also consume an optional trailing newline on the same line, so a line that contained only the marker disappears entirely instead of becoming a blank line.
2. After the strip pass:
   - collapse any run of 3+ newlines down to 2,
   - trim trailing whitespace/newlines from `cleanContent` so the task-card block renders directly under the last line of prose.
3. Reduce the `marginTop` on the cards wrapper from `4` to `0` (or keep `4`) — the real fix is the whitespace cleanup; spacing between cards already comes from each card's own `marginTop: 8`.

No other files, no backend, no hook or card changes.

## Out of scope
- Loading skeleton height (80px) — kept; it only shows briefly per card and is not the gap the user is describing.
- BountyPromotions, redirect screen, visits counter — untouched.
