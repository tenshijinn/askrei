# Sync the floating points widget with the account Referrals & Points card

Right now the two surfaces get their numbers from different places: the floating widget reads the points balances directly, while the account card calls the referral-stats endpoint. They can disagree, and the widget shows none of the referral activity.

## Goal

One shared source of truth feeding both:

- **Floating widget (left, most pages)** — compressed shorthand: points total, pending, and a tight referral line (referrals this month / points this month) plus the referral link and share buttons it already has.
- **Account "Referrals & Points" dropdown** — the detailed view: all-time and this-month referrals, conversions split (registrations / purchases / bookings), clicks, points this month, points all time, and the referral link.

## Approach

1. **Shared hook** `useReferralAndPoints({ registrationWallet, connectedWallet, xUserId })`
   - Resolves the wallet set exactly as the widget does today (registry wallets for the X id + connected + registration wallet).
   - Aggregates `user_points` (total, pending, lifetime SOL, wallet count) — unchanged logic, moved out of the widget.
   - Calls the existing `referral-stats` function for referral figures.
   - Single React Query key so both surfaces share one cache entry and refetch together; keeps the existing 30s refresh and realtime invalidation.
2. **Referral link** also moves into the hook (the `generate-referral-code` call), so the widget and the account card show the same code without duplicate requests.
3. **Widget** becomes presentation-only over the hook. Collapsed header stays as-is (points + pending). Expanded panel gains a compact two-value referral row and keeps "How to earn" and the share controls.
4. **Account card** is expanded to the fuller grid described above, plus the referral link/share row so the user can act from either place.
5. **Backend**: `referral-stats` already returns all-time/monthly referrals, conversions, clicks and points. It needs a small addition so the detailed view can break conversions down by type (registration / payment / booking) instead of just a single total.

## Technical notes

- New file `src/hooks/useReferralAndPoints.ts`; `ReiEarningsHub.tsx` and `rei/ReferralStatsCard.tsx` both consume it. No change to where they're mounted in `src/pages/Rei.tsx`.
- Query key includes the resolved identity (`xUserId`, primary wallet) so cache sharing is exact.
- `referral-stats`: add per-type counts for the month and all time in the JSON response; the existing fields stay so nothing breaks.
- Styling stays with the current inline token values used across these two components; no design-system changes.

## Out of scope

Monthly points reset job and the community-pot leaderboard — still planned separately.
