# Fix scroll-scrubbed video on Chrome / Brave

## Root cause
Chromium can only paint a video frame by decoding forward from the nearest keyframe. `public/scroll-rei.mp4` was encoded with a standard GOP (one keyframe every ~2s), so when `ScrollVideoHero` sets `video.currentTime` on every scroll tick, Chromium stalls or refuses to update the canvas. Safari tolerates sparse keyframes, which is why it looks fine there.

A secondary issue: Chromium often needs the video to have been "played" once and to be `+moov`-at-front (faststart) before `currentTime` writes paint reliably.

## Changes

### 1. Re-encode `public/scroll-rei.mp4` for frame-accurate seeking
Re-encode the source `scroll-rei.mp4` with every frame as a keyframe and faststart, while keeping the file small:

```bash
ffmpeg -i public/scroll-rei.mp4 \
  -an \
  -vf "scale=-2:720,fps=24" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -x264-params "keyint=1:min-keyint=1:scenecut=0" \
  -crf 24 -preset slow \
  -movflags +faststart \
  public/scroll-rei.mp4.tmp && mv public/scroll-rei.mp4.tmp public/scroll-rei.mp4
```

All-intra (`keyint=1`) makes the file 3–6× larger per second than a normal GOP, but at 720p24 + crf 24 the existing ~15 s clip should still land around 3–6 MB. If size becomes a problem we fall back to `keyint=2` (every other frame a keyframe) which Chromium still scrubs acceptably.

Also produce a WebM/VP9 sibling for browsers that prefer it — VP9 seeks faster in Chromium:

```bash
ffmpeg -i public/scroll-rei.mp4 \
  -an -vf "scale=-2:720,fps=24" \
  -c:v libvpx-vp9 -b:v 0 -crf 32 \
  -g 1 -keyint_min 1 \
  -row-mt 1 -tile-columns 2 \
  public/scroll-rei.webm
```

### 2. Harden `ScrollVideoHero.tsx`
- Add a `<source>` for both `webm` and `mp4` (webm first) so Chromium picks the VP9 build.
- After `loadedmetadata`, call `video.play().then(() => video.pause())` to prime the decoder. This is the single most common fix for "Chromium won't paint after `currentTime =`".
- Use `requestVideoFrameCallback` when available to know when a seeked frame has actually been painted, and only schedule the next seek after that — eliminates the cascading-seek stall in Chromium.
- Keep the existing smoothing (`diff * 0.5`) but cap the per-tick delta to ~1/24 s so we never ask Chromium to jump more than a frame between paints.

### 3. No layout / content changes
Only the video file and the player effect change. The split-panel layout, snap markers, and left-track controller stay exactly as they are.

## Technical notes
- All-intra h.264 (`keyint=1`) is the industry-standard fix for scroll-scrubbed video. It's what Apple's product pages use.
- `+faststart` moves the `moov` atom to the front so playback / seeks start before the whole file downloads.
- `requestVideoFrameCallback` is supported in Chrome 83+, Brave, Edge; Safari has it behind a flag but our existing rAF path still works there.
- No new dependencies, no backend changes.

## Verification
1. Hard-reload `/` in Chrome and Brave, scroll through the hero, confirm the video tracks the scroll position smoothly in both directions.
2. Confirm Safari still works.
3. Check `public/scroll-rei.mp4` and `.webm` sizes are reasonable (< ~8 MB combined).