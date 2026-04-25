## Goals
Bundle the previous fixes (broken submit + "Claim NFT" copy) with two new high-tech UX upgrades to the registration flow: a fixed 60s recording window with countdown, and a multi-stage "Rei is analyzing you" progress experience after pressing Register.

---

## 1. Fix the broken `submit-rei-registration` upsert
**Cause:** Function tries to write `skills` and `work_experience` columns that don't exist on `rei_registry` (Postgres `PGRST204`).

**Fix (recommended — preserve AI-extracted data):**
- Migration adding to `public.rei_registry`:
  - `skills text[] not null default '{}'`
  - `work_experience jsonb not null default '[]'::jsonb`
- No RLS change needed (existing policies cover all columns).

## 2. Rename button + scrub NFT copy
- `src/pages/Rei.tsx` line 303 — `'Register & Claim NFT'` → `'Register'`. Edit/reanalyze labels stay.
- `supabase/functions/submit-rei-registration/index.ts` — drop NFT placeholder log + change success message from *"Your Proof-of-Talent NFT will be minted shortly"* to *"Your Rei profile is live."*
- `src/components/joinrei/HomeValueProp.tsx` — change *"Earn Points, Redeem NFTs"* → *"Earn Points & Rewards"* (keeps the value prop without the dead NFT promise).

## 3. Fixed 60-second recording window with countdown
**File:** `src/components/AudioRecorder.tsx`

- Add `maxDurationSeconds` prop (default `60`); keep `maxDurationMinutes` for back-compat. `Rei.tsx` passes `maxDurationSeconds={60}`.
- Replace the small floating timer pill with a **prominent countdown**:
  - Big `MM:SS` showing **time remaining** (counts down from `01:00` → `00:00`).
  - Linear progress bar underneath using shadcn `<Progress>` — starts full, drains to 0.
  - Color shifts via existing tokens: neutral `>20s`, amber `≤20s`, destructive red `≤5s`.
  - Subtle pulse on the digits during the final 5 seconds.
- Auto-stop already exists at `maxDurationMs`; rewire to seconds and update toast to *"60-second limit reached"*.
- "Stop Recording" button stays — user can end early.
- Remove the now-redundant top-right timer pill (countdown replaces it).

## 4. "Rei is analyzing you" progress overlay after Register
**File:** `src/pages/Rei.tsx` (`handleSubmit`) + new component.

Currently the Register button just shows *"Submitting..."*. Replace with a **full-screen overlay** that visualizes Rei's pipeline so the user feels the AI working.

**New component:** `src/components/ReiAnalysisOverlay.tsx`
- Fixed full-viewport overlay (z-50, dark backdrop, blur), matches manga terminal aesthetic.
- Rei logo + animated scanline (CSS only — reuse existing `rei-theme` tokens, accent `#ed565a`).
- 4 sequential stages with icon, label, per-stage progress:
  1. **Uploading audio** — driven by real Supabase storage upload progress (use `XMLHttpRequest` upload events via a small helper since `supabase-js` storage doesn't expose progress; if XHR path is too invasive, fall back to indeterminate animation for stage 1 only).
  2. **Transcribing voice** — indeterminate shimmer while edge function runs transcription.
  3. **Analyzing profile with Rei AI** — indeterminate shimmer while Gemini analysis runs.
  4. **Categorizing skills & experience** — indeterminate shimmer until response returns.
- Overall thin progress bar at top (25% per completed stage).
- Stage states: `pending` (dim) / `active` (animated dots, accent) / `done` (check, muted).
- Rotating "thinking" lines under the active stage from a small pool, e.g. *"parsing voice patterns…"*, *"matching to skill clusters…"*, *"scoring contribution signals…"* — refreshes every ~2s, purely cosmetic.
- On completion: success flash → fade out → success state renders as today.
- On error: red state with the actual error message.

**Integration in `handleSubmit`:**
- Add `analysisStage` state (`'uploading' | 'transcribing' | 'analyzing' | 'categorizing' | null`) and `uploadPercent`.
- Set `'uploading'` before storage upload → `'transcribing'` after upload completes (right before `functions.invoke`) → time-based advancement to `'analyzing'` (~6s in) and `'categorizing'` (~16s in). Real completion always wins and snaps to done.
- Render `<ReiAnalysisOverlay stage={analysisStage} uploadPercent={uploadPercent} errorMessage={...} />` whenever `analysisStage !== null`.

**Why time-based stage progression:** the edge function returns one response at the end — no streaming today. Estimated timings keep the *high-tech feel* without rewriting the backend, and the real result always overrides the timer so users never see stuck fake progress.

## 5. Improve error visibility (carryover)
- `handleSubmit` catch block: surface `error.message` in the toast (fall back to generic if missing).

---

## Files touched
- **Migration**: add `skills`, `work_experience` columns to `rei_registry`
- **New**: `src/components/ReiAnalysisOverlay.tsx`
- **Edit**: `src/components/AudioRecorder.tsx` (60s countdown + progress bar)
- **Edit**: `src/pages/Rei.tsx` (button label, overlay integration, error surfacing, 60s prop)
- **Edit**: `supabase/functions/submit-rei-registration/index.ts` (drop NFT copy/logs)
- **Edit**: `src/components/joinrei/HomeValueProp.tsx` (NFT copy → Rewards)

## Out of scope
- No streaming/SSE rewrite of `submit-rei-registration` (large refactor; time-based stage UI is the pragmatic win).
- No actual NFT system removal beyond UI/log copy (no NFT code exists today — only marketing strings).
- No changes to recording audio quality/format.