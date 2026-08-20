# Update /joinrei hero (Diamond Hand section)

## Goal
Refresh the first `/joinrei` parallax section with the new Diamond Hand background, cream/beige typography, updated headline/subtitle, smaller bold pills, and a new "KOL Boosted" pill.

## What will change
- **Background images**
  - Upload `bg-diamondhand-desktop.png` and `bg-diamondhand-mobile.png` to Lovable Assets.
  - Replace the existing `joinrei-desktop-bg-2` / `joinrei-mobile-bg-2` backgrounds in `JoinReiHero.tsx` with the new assets.
- **Typography colour**
  - Change all black (`#181818`) text in the hero to the cream/beige primary colour (same as the "How to Use" title on parallax 2, i.e. `text-primary` / `hsl(var(--primary))`).
  - Keep the red typed-out outcome text (`#ed565a`) unchanged.
- **Headline**
  - Old: `Filters for Diamond Hand Holders.`
  - New: `Target Diamond Hand Holders` with **"Diamond Hand Holders"** in bold.
- **Subtitle**
  - New copy (words in brackets are bold):
    ```
    Cut your marketing cost by
    promoting your project with (Rei AI).
    Rei blocks (Farmers), (Paper-hands) and (Sybils)
    with a user (Diamond Hand Score).
    ```
- **Pills**
  - Shrink size (smaller padding/font).
  - Make pill text bold.
  - Change pill text and border colour to cream/beige (`text-primary border-primary`).
  - Add an extra pill: **"KOL Boosted"**.

## Files to edit
- `src/components/joinrei/JoinReiHero.tsx`
- `src/assets/joinrei/bg-diamondhand-desktop.png.asset.json` (new)
- `src/assets/joinrei/bg-diamondhand-mobile.png.asset.json` (new)

## Verification
- Run `bun run build`.
- Check `/joinrei` on desktop and mobile viewports to confirm the new background, cream text, updated headline/subtitle, and pills render correctly.
