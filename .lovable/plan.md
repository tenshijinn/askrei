## Scope

Update the desktop hero in `src/components/joinrei/ScrollVideoHero.tsx` (Block 1, left panel) to match the attached screenshot. Mobile layout untouched.

## Changes

### 1. Move CTA buttons below the pills
- Move the desktop "Start Now" + "How it Works" buttons out of the bottom `flex` row and place them directly under the three pills, inside the same top content block.
- Remove the now-empty bottom button row.

### 2. Restyle the three pills (`SimplePill` usage in hero only)
- Transparent background, muted grey text, muted grey border.
- Replace `bg-[#181818] border border-primary/20 text-cream/80` with `bg-transparent border border-white/20 text-white/50` (keep font-mono, same padding).
- Apply only to the hero's three pills (Early Discovery / Save Hours / Bounties-to-Skills-Matched). Do not touch `SimplePill` used inside `MiniFrame` (How-it-works section) to avoid regressing that section — introduce a local `HeroPill` component instead of editing the shared `SimplePill`.

### 3. Two new cards below the CTAs (desktop only)

Add a two-column row (`grid grid-cols-[auto,1fr] gap-4`) beneath the buttons:

**Left card — Latest Bounty**
- Label "Latest Bounty" (small, muted, uppercase-ish, matches screenshot).
- Big value showing the compensation of the newest bounty, e.g. `$1800`.
- Data: `supabase.from('v_public_tasks').select('compensation, created_at').order('created_at', { descending: true }).limit(1)`.
- Parse a leading `$<number>` (with K/M suffix support) out of `compensation`; fallback to raw string if no match; hide card if null.
- Refresh hourly: `setInterval(fetch, 60 * 60 * 1000)` inside a new `useLatestBounty()` hook, plus initial fetch on mount.

**Right card — Bounty Platforms Aggregated ticker**
- Label "Bounty Platforms Aggregated".
- Horizontal marquee scrolling right → left, infinite loop, slow (~40s per cycle).
- Content: greyscale logos of Zealy, Galxe, TaskOn, Scribble, Superteam Earn.
- Register the five uploaded images as Lovable assets under `src/assets/joinrei/` (`logo-plat-zealy.png`, `logo-plat-taskon.png`, `logo-plat-galxe.png`, `logo-plat-scribble.png`, `logo-plat-superteam-earn.png`) via `lovable-assets create` from `/mnt/user-uploads/`.
- Marquee implementation: two identical `<div>` tracks side-by-side inside an `overflow-hidden` wrapper, animated with a CSS keyframe `translateX(0) → translateX(-50%)` for seamless loop. Even spacing via `gap-12` between logos. Logos rendered at `h-6 w-auto opacity-60`. Add `@keyframes hero-ticker` in the same file via a scoped `<style>` block (matches the existing inline `<style>` pattern used in `BountyPromotions.tsx`).
- Pause on hover: `animation-play-state: paused` on `:hover`.

### 4. Layout notes
- Both cards use existing card styling vocabulary: `rounded-xl border-[0.5px] border-white/10 bg-[#141414]/60 backdrop-blur-sm p-4`.
- Left card is content-width (auto); right card fills remaining space and clips overflow.
- Only rendered inside the `hidden lg:block` desktop container so mobile is unaffected.

## Files touched
- `src/components/joinrei/ScrollVideoHero.tsx` — layout, new `HeroPill`, `LatestBountyCard`, `PlatformTicker`, keyframes.
- `src/assets/joinrei/logo-plat-*.png.asset.json` — 5 new asset pointer files (created via CLI).

## Out of scope
- Mobile hero layout.
- `MiniFrame` / How-it-works pills.
- Any backend schema changes; uses existing `v_public_tasks` view.
