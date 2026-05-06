## Changes

### 1. Replace speech bubble image
- Copy `user-uploads://rei-speach-2.gif` → `src/assets/joinrei/rei-speech-bubble.gif` (overwrite). Used by both `/` (HomeHero) and `/joinrei` (JoinReiHero) automatically — no code changes needed.

### 2. Harden the analysis JSON parser (`supabase/functions/analyze-rei-profile/index.ts`)
- Strip Markdown code fences (```json … ```) and surrounding whitespace from the AI response before `JSON.parse`.
- Add a fallback regex to extract the first `{ … }` block if the model still wraps the JSON in commentary.
- Keep the existing tool-calling loop unchanged.

### 3. Retry UX instead of silent failure
- In `ReiAnalysisOverlay.tsx`: when `stage === 'error'`, show the existing red error block with copy along the lines of *"Account update was unsuccessful."* and add a **Retry** button next to **Close** that calls a new `onRetry` prop.
- In `src/pages/Rei.tsx`: store the last submission payload (audio blob / `useExistingTranscript` flag, role tags, portfolio URL) in a ref so `handleSubmit` can be re-invoked. Pass `onRetry={handleSubmit}` to the overlay.
- No "Re-analyze" button is added anywhere else (per your call — keeps UX clean).

### Technical notes
Parser change (concise):
```ts
const cleaned = analysisText
  .replace(/^\s*```(?:json)?\s*/i, '')
  .replace(/\s*```\s*$/i, '')
  .trim();
let toParse = cleaned;
if (!toParse.startsWith('{')) {
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) toParse = m[0];
}
finalAnalysis = JSON.parse(toParse);
```

Retry flow: the overlay error state remains visible until the user clicks Retry (re-runs `handleSubmit`) or Close (clears `analysisStage`). The previous transcript/audio is reused so users don't have to re-record.

### Files touched
- `src/assets/joinrei/rei-speech-bubble.gif` (replace)
- `supabase/functions/analyze-rei-profile/index.ts` (parser hardening)
- `src/components/ReiAnalysisOverlay.tsx` (Retry button + copy)
- `src/pages/Rei.tsx` (wire up `onRetry`)

### Note on your existing empty profile
Once the parser fix is deployed, your next save attempt will succeed. To repair the existing record without the re-analyze button, just open the edit flow and re-submit (your transcript is already on file, so no re-recording needed) — the failure that wiped your fields was the parser, not the transcript.
