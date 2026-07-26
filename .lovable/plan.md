## Goal

Three small polish changes to the registration flow in `src/pages/Rei.tsx` (and the connect card):

1. Make the Solana and EVM wallet buttons visually consistent inside one card.
2. Re-order the 3-step flow so it feels more natural.
3. Add explicit `Step N of 3` labels above the progress bar.

## 1. Unified wallet card

Today the Solana button is a purple filled `WalletMultiButton` and the EVM button is a transparent outlined `ConnectButton.Custom` — visually mismatched even though they sit in the same card.

Change both to the same button style so they read as a matched pair:

- Same height (44px), same `rounded-[28px]`, same font size/weight.
- Solana = **primary filled** (peach `#e8c4b8` on dark, matches the "Continue" and "Follow" buttons already used in `ConnectReiCard`) since it's required.
- EVM = **outlined ghost** (transparent, hairline border) since it's optional.
- Wrap both under one `rei-surface-2` card with a subtle divider between them, so it's obviously one "Wallets" card with two rows instead of two loose buttons.
- Keep the small `SOLANA WALLET · REQUIRED` / `EVM WALLET · OPTIONAL` labels as row headers inside the card.
- Style `WalletMultiButton` via its className to match — override its default purple to the peach primary and align padding/radius. Connected-state pill (`Connected · 0x1234…abcd`) stays the same for both.

## 2. Flow re-order

Current order after X sign-in:
1. Connect Rei to your workflow (Follow @AskRei_ + MCP)
2. Connect wallets
3. Submit details (voice intro, roles, consent)

Problem: step 1 is entirely optional "activation extras" but sits before the required work. Users hit soft nice-to-haves before they've actually finished registering.

Proposed new order:
1. **Connect your wallets** (Solana required, EVM optional) — the highest-signal required step, and the one that powers Rei's Diamonds scoring the analysis depends on.
2. **Tell us about you** (voice intro + roles + consent, i.e. today's step 3).
3. **Activate Rei** (follow @AskRei_ + MCP tiles) — moved to the end as a "you're in, here's how to plug Rei into your workflow" upsell. Continue button becomes "Finish" and lands them on `/rei`.

Rationale: required → required → optional, and the MCP/Follow card fits better as a post-registration success screen than as a gate before wallets.

The `ConnectReiCard` component itself does not need to change — it's already framed as optional. We just move where it's rendered in `Rei.tsx` and rename its Continue button copy to "Finish setup".

## 3. Step indicators

Above the existing 3-segment progress bar (line 537), add a small header row:

```
Step 2 of 3 · Connect your wallets
```

- Left side: `Step {step} of 3` in the muted peach `#e8c4b8`, 11px, uppercase, letter-spaced — matches the existing "Recommended" / "Or use Rei…" eyebrow style used in `ConnectReiCard`.
- Right side: current step title (`Sign in with X` / `Connect your wallets` / `Tell us about you` / `Activate Rei`) in `#a09e9a`, 12px.
- The 3-segment bar stays underneath, filled peach up to the current step.

Also drop the inline `1` / `2` / `3` numbered circles that currently sit next to each section header inside the card (lines 604, 689) — with the top step indicator they become redundant. Replace each with just the section title (and the existing check-mark chip when complete).

## Technical notes

- File touched: `src/pages/Rei.tsx` only. `ConnectReiCard.tsx` gets a one-line copy change ("Continue → Connect wallets" → "Finish setup").
- `useEffect` step-advancers (lines 107–108) update to the new order:
  - `step 1 → 2` when Solana wallet connected (was: when X connected).
  - `step 2 → 3` when audio + roles + consent submitted (was: when wallet connected).
  - X sign-in is a precondition for showing step 1 at all, same as today; the "identity verified" pill stays pinned at the top of the card across all three steps so users see they're signed in.
- `hasWallet` / `profileActivated` gates get remapped to the new order; no schema or backend changes.
- No changes to `submit-rei-registration`, `analyze-rei-profile`, or the Diamonds engine.

## Out of scope

- No changes to what data is collected or how scoring works.
- No changes to the sign-in / sign-up entry screens.
- No changes to the post-registration `/rei` app shell.
