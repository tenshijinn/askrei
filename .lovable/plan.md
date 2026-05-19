# Walkthrough refinements

## Changes

### 1. Split the AskRei step into two

Replace the single AskRei tab step with two focused steps that match the screenshots:

- **Step A — Suggestion buttons**: highlights the row of preset buttons ("find bounties matching my skills", "show available tasks and quests", etc.) at the top of the chat. Card explains the shortcuts in plain language.
- **Step B — Typing bar**: highlights only the bottom input field (the "@user > type a message..." bar). Card explains typing free‑form requests and hitting send.

The existing "AskRei — chat with Rei" video card stays as the intro step (highlighting the AskRei tab itself). After it, the tour drills into the two interface pieces.

### 2. Tighten the red highlight around the typing field

The highlight currently uses a fixed 8px outer padding for every step, which makes the input bar look loose. Add a per‑step `highlightPadding` option to the tour and use a small value (≈2px) for the typing‑bar step so the red ring hugs the field like the reference screenshot.

### 3. Compress the walkthrough videos

Re‑encode the three MP4s in `public/walkthrough/` with ffmpeg (H.264, CRF ~28, preset slow, scaled to 720p max, audio stripped) to cut filesize meaningfully while keeping visible quality. Originals are moved to `public/walkthrough/originals/` as backups before the new files overwrite the live paths.

Current sizes:
- rei-find-bounties.mp4 — 871K
- rei-points.mp4 — 155K
- rei-promote-bounties.mp4 — 2.7M (biggest win here)

## Technical notes

- Add a `data-tour="askrei-presets"` attribute to the preset-button row in `src/components/ReiChatbot.tsx` (line 215 wrapper div).
- In `src/components/joinrei/WalkthroughTour.tsx`: extend `TourStep` with `highlightPadding?: number` and replace the hard‑coded `PAD` constant in the highlight rect math with `resolvedStep.highlightPadding ?? 8`.
- In `src/pages/Rei.tsx` `tourSteps`: insert a new step targeting `[data-tour="askrei-presets"]` (placement: bottom, narrow card) before the typing‑bar step, and set `highlightPadding: 2` on the `[data-tour="askrei-chat-input"]` step.
- Compression command per file: `ffmpeg -i input.mp4 -vf "scale='min(1280,iw)':-2" -c:v libx264 -preset slow -crf 28 -an -movflags +faststart output.mp4`. Run via `code--exec`, verify each new file is smaller and plays, then swap in place (originals copied to `public/walkthrough/originals/` first).
