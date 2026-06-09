# Terminal-style animated buttons — sandbox demo

Build a single internal demo page at **`/button-lab`** that renders 4 sample buttons side-by-side, each labeled with the technique it uses, so you can pick a winner before we roll it out to a real page.

All 4 share the same click behavior: on click, the label briefly becomes `> running…` (≈250ms) and *then* navigates / fires the action. All 4 use the existing `btn-manga btn-manga-primary` shell so colors, border, and font stay on-brand.

## The 4 samples

```text
┌──────────────────────────────────────────────────────────────────┐
│  Button Lab  /  hover each, then click                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [ Promote Task ▍ ]      ← 1. Typewriter (CSS/JS, no deps)       │
│  Label: "Typewriter — pure JS"                                   │
│                                                                  │
│  [ P#o@oZ&te T*sk ]      ← 2. Glitch / scramble (pure JS)        │
│  Label: "Scramble — pure JS"                                     │
│                                                                  │
│  [ Promote Task ░░░ ]    ← 3. Lottie overlay (caret+scanline)    │
│  Label: "Lottie overlay — lottie-react + .json"                  │
│                                                                  │
│  [ ▶▶▶▶▶▶▶▶▶▶▶ ]         ← 4. Full Lottie label                  │
│  Label: "Full Lottie label — .json animation as text"            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 1. Typewriter — pure JS
- Hover: clears the label, re-types char by char (~30ms/char), blinking `▍` caret stays at the end.
- Click: replaces with `> running…` + blinking caret for 250ms, then fires action.
- No dependencies. Lightest, most "terminal".

### 2. Glitch / scramble — pure JS
- Hover: each character cycles through random glyphs `!<>-_\/[]{}—=+*^?#` then settles on the real char (Matrix-style, ~600ms total).
- Click: same `> running…` flash → navigate.
- No dependencies.

### 3. Lottie overlay — `lottie-react` + small `.json` files
- Static label, but a Lottie **caret blink** sits to the right and a **scanline sweep** Lottie plays across the button on hover.
- Click: Lottie **loader dots** play inside the button for 250ms → navigate.
- Adds `lottie-react` (~50KB) + 3 small `.json` files (caret, scanline, loader). I'll generate the JSON inline (they're tiny, hand-authored shape layers — no external sourcing needed).

### 4. Full Lottie label — entire text is a Lottie animation
- The label "Promote Task" is itself a pre-rendered Lottie that types itself in on hover and shows a running state on click.
- Adds `lottie-react` + one larger `.json` per unique button label. Highest fidelity, heaviest to author and maintain (every new label = new Lottie file).

## How to evaluate

Open `/button-lab`, hover each, click each. Tell me which you want and I'll:
- Remove the lab page.
- Apply the winning effect to whichever button set you choose (e.g. just the primary CTAs on `/rei`, or all `btn-manga` site-wide).

## Files to add (build phase)

- `src/pages/ButtonLab.tsx` — the demo page with the 4 samples + labels.
- `src/components/buttons/TypewriterButton.tsx`
- `src/components/buttons/ScrambleButton.tsx`
- `src/components/buttons/LottieOverlayButton.tsx` + `src/assets/lottie/caret.json`, `scanline.json`, `loader-dots.json`
- `src/components/buttons/FullLottieLabelButton.tsx` + `src/assets/lottie/promote-task-label.json`
- `src/App.tsx` — add `/button-lab` route (unlinked from nav; you reach it by URL only).
- `package.json` — add `lottie-react` (used by samples 3 & 4 only).

Nothing on `/rei`, `/joinrei`, `/`, `/unlimited-posts`, or `/agents` changes in this phase.

## Technical notes

- Click delay is implemented with `setTimeout(navigate, 250)` so the terminal flash is visible without feeling sluggish.
- All animations respect `prefers-reduced-motion` (fallback to instant label, no flash).
- Lottie JSON for samples 3 & 4 is committed in `src/assets/lottie/` as plain JSON (not externalized to CDN — they're small and parsed at build time).
- Existing `.btn-manga` CSS in `src/index.css` is untouched; the sample components wrap it.
