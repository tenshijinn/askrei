# Fix still-unclickable wallet connect modal

## Symptom
The wallet selection screen opens, but wallet rows still cannot be clicked.

## Root cause
The wallet library renders the overlay and the wallet content inside the same `.wallet-adapter-modal` portal:

```text
.wallet-adapter-modal
  .wallet-adapter-modal-container
    .wallet-adapter-modal-wrapper   <- clickable wallet list
  .wallet-adapter-modal-overlay     <- backdrop, rendered after content
```

The previous fix raised `.wallet-adapter-modal-overlay` to an extremely high z-index. Because the overlay is a child rendered after the wallet content, it is still sitting above the wallet list and catching all clicks.

## Fix
Keep only the outer modal portal above the walkthrough overlay, then rebuild the wallet modal's internal stacking order:

```css
.wallet-adapter-modal {
  z-index: 2147483647 !important;
  pointer-events: auto !important;
}

.wallet-adapter-modal-overlay {
  z-index: 0 !important;
}

.wallet-adapter-modal-container {
  position: relative !important;
  z-index: 1 !important;
  pointer-events: none !important;
}

.wallet-adapter-modal-wrapper {
  position: relative !important;
  z-index: 2 !important;
  pointer-events: auto !important;
}
```

This keeps the whole wallet modal above the walkthrough, while ensuring the backdrop stays behind the actual wallet buttons.

## Files touched
- `src/index.css` only.

No backend changes.
