# Bounty Calculator: 5 free tries, then paywall

Gate the /earn calculator after 5 free calculations with a centred dialogue offering a free Rei membership route or a paid 100-calculation pack ($5 in SOL via x402, Stripe as an alternative).

## How it works for the user

1. Anonymous visitor lands on /earn and can change inputs freely for 5 calculations.
2. On the 6th change, the card blurs behind a centred modal with two side-by-side panels:
   - Left: "20 Free Uses" — 20 calculations per week as a Rei member. Buttons: `Sign Up` and `Sign In`, both leading to rei.chat (landing page) / `/rei`.
   - Right: "100 Uses for $5" — "$0.05 per calculation". Primary button `Connect to Use` (wallet not connected) which becomes `Pay $5 in SOL` once connected. Secondary text link: `Pay with card` (Stripe embedded checkout).
3. x402 flow: connect wallet → server fetches live SOL price → builds a $5-equivalent SOL transfer → user signs → server verifies on-chain → 100 calculations credited to that wallet.
4. Returning payer: clicking `Connect to Use` with the same wallet restores their remaining balance immediately — no new payment.
5. While credits remain, a small counter chip on the card shows e.g. "87 calculations left". Free users see "3 free left".

A calculation = a committed change to any input (amount, frequency, mode, platform, asset, period), debounced so typing "100" counts once. Loading the page, restoring a shared link, and sharing to X never consume credits.

## Modal design (matches page branding)

- Warm near-black panel (`#0e0b09`), 1px hairline border, soft outer glow, rounded 18px, backdrop blur over the card.
- Two panels split by a vertical hairline; stacks vertically on mobile.
- Left panel: Rei logo mark, mono heading, peach outline button (`#e9c8ba`).
- Right panel: Solana mark, mono heading, filled peach primary button (not purple — keeps Rei branding), with SOL amount + live SOL price shown under it once quoted.
- Same type scale, mono labels, and peach accent already used on the card; no new fonts or colours.
- Escape/backdrop click closes the modal but the calculator stays locked until credits exist.

## Technical notes

Backend (Lovable Cloud):

- New table `earn_calc_usage`: `id`, `ip_hash`, `wallet_address` (nullable), `free_used`, `free_window_start`, `paid_credits`, `credits_source`, `updated_at`. RLS enabled, no client access (service-role only), with GRANTs for `service_role`.
- New edge function `earn-calc-quota` (`verify_jwt = false`): actions
  - `status` — returns free-remaining / paid-remaining for the caller's IP hash and optional wallet.
  - `consume` — atomically decrements paid credits, else free allowance; returns `{ allowed, remaining, reason }`.
  Free allowance: 5 per IP for anonymous, 20 per week for wallets/handles present in `rei_registry`, reset weekly (same IP-hash pattern as `ask-rei-public`).
- New edge function `earn-calc-purchase` (`verify_jwt = false`): verifies a completed `payment_references` row (`payment_type: 'x402'`, `amount` matching the $5 SOL quote, `status: 'completed'`) and credits 100 uses to that wallet. Idempotent per `tx_signature`.
- Reuse existing `x402-create-payment` (already converts USD→SOL from the multi-source oracle) and `x402-verify-payment` unchanged; pass `amount: 5`, `memo: 'earn-calc-100'`.
- Stripe path: reuse existing `create-checkout` with a new one-time price `earn_calc_100` ($5). A `payments-webhook` branch credits 100 uses against the session's email; the return page redirects back to /earn. This is the secondary option — x402 is primary.

Frontend:

- `src/components/earn/CalcPaywallModal.tsx` — the dialogue, wallet connect/pay states, loading + error states, Stripe fallback.
- `src/hooks/useCalcQuota.ts` — status fetch, debounced `consume` gate, local mirror for instant UI, wallet-change refresh.
- `BountyDefiCard.tsx` — wrap input handlers through the quota gate, add remaining-uses chip, render the modal, blur/disable controls when locked.
- `earn.css` — modal, panel, and chip styles reusing existing tokens; keeps everything above the fold on short viewports.
- Wallet adapter is already provided app-wide (`WalletProvider` in `App.tsx`), so `/earn` can use the same connect flow as the rest of the app.

## Notes

- Server-side counting means clearing localStorage does not reset the free tries; IP hashing keeps it privacy-safe (no raw IPs stored).
- Credits are tied to the paying wallet, so the same wallet works across devices.
