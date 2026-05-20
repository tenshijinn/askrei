# Fix unclickable wallet modal

## Symptom
After the previous z-index change, the Solana wallet modal opens (Brave / Phantom / MetaMask listed) but none of the wallet rows are clickable.

## Root cause
In `src/index.css` we raised BOTH `.wallet-adapter-modal-overlay` AND `.wallet-adapter-modal` to the same max z-index (`2147483647`). The overlay is a sibling that renders on top of the modal content when they share a stacking value, so it intercepts every click on the wallet list.

The wallet-adapter's default stack is overlay `1040`, modal `1050` — the modal must stay above the overlay.

## Fix
Edit `src/index.css` so the overlay stays below the modal, and only the modal/container is raised above the walkthrough spotlight:

```css
.wallet-adapter-modal-overlay {
  z-index: 2147483646 !important;
}
.wallet-adapter-modal,
.wallet-adapter-modal-container {
  z-index: 2147483647 !important;
}
```

Also ensure the modal content itself receives pointer events (it does by default, but we'll leave a `pointer-events: auto` on `.wallet-adapter-modal` as a safety net since the walkthrough overlay uses `pointer-events: none` tricks).

## Files touched
- `src/index.css` — split overlay vs. modal z-index, add pointer-events safety

No other files, no backend changes.
