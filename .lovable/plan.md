# Monthly Referral Leaderboard + Top-10 Confirmation

Adds a monthly, self-resetting top-10 referrer leaderboard using the pot split from the Refer-To-Earn article, plus a month-end confirmation listing the winning X accounts and wallets so you can announce them on X or DM each winner.

## Rules (from the article)

- Ranking metric: referral points earned inside the UTC calendar month (registration 25, payment 100, booking 10).
- Top 10 only. Pot split: 1st 25%, 2nd 15%, 3rd 10%, 4th-10th 7.1% each.
- Monthly "reset" is by window, not by wiping data: each month ranks only that month's conversions, so the board naturally starts empty on the 1st. Lifetime points stay intact.

## What the user sees

1. **Live leaderboard (current month)** — public. Top 10 rows with rank, masked identity (X handle when known, otherwise shortened wallet), points this month, and pot share %. Shown as a new accordion in the account area under "Referrals & Points", and embedded on the Refer-To-Earn article page so readers see the real board.
2. **Your rank** — if the signed-in member is outside the top 10, their own rank and points appear below the board.
3. **Past months** — a month selector to view any closed month's final top 10.
4. **Winner confirmation (no email)** — on the 1st of each month the closed month is locked in, and an admin-only "Winners" panel on the card shows each winner's X handle, wallet, points and pot share. Two one-tap helpers: **Copy announcement** (ready-to-post X text listing the top 10 with their @handles) and per-winner **DM on X** links that open the direct-message window for that handle. A dated list of past winners stays available.

## Technical plan

**Database (migration)**
- `referral_leaderboard_snapshots`: `id`, `period_month` (date, first day of month), `rank`, `wallet_address`, `x_user_id`, `referral_code`, `points`, `conversions`, `pot_share_pct`, `created_at`; unique on `(period_month, rank)`. GRANT `SELECT` to `anon`/`authenticated` (public board), `ALL` to `service_role`; RLS on with a public read policy and no client write policy.
- `referral_leaderboard(p_month date)` security-definer SQL function: aggregates `referral_conversions.points_awarded` joined to `referral_codes` for the month, groups by promoter wallet, orders by points desc then earliest conversion as tiebreak, returns top 50 with rank. Used for the live board.

**Edge functions**
- `referral-leaderboard` (verify_jwt=false): returns `{ month, live, rows[], viewerRank }` for the current month, or a closed month's snapshot rows when `month` is passed. Masks identities (handle or `abcd…wxyz` wallet); full wallets returned only for admin callers (validated JWT + `has_role(admin)`).
- `close-referral-month` (verify_jwt=false, internal key required): computes the previous month's top 10, resolves each promoter's X handle from `rei_registry`, writes snapshot rows idempotently, and logs the result to `ops_events` via `log_ops_event` so the close is auditable. Safe to re-run.
- Cron: `pg_cron` job at 00:15 UTC on day 1 calling `close-referral-month`.

**Notifying winners**
- No email infrastructure is used. The snapshot stores `x_handle` alongside the wallet; the admin panel builds the X announcement text client-side and links to `https://x.com/messages/compose?recipient_id=<x_user_id>` for DMs (falls back to the profile link when the id is unknown).

**Frontend**
- `src/components/rei/ReferralLeaderboardCard.tsx` — table (rank, identity, points, pot %), month selector, "your rank" row, loading/empty states, styled to match `AccountAccordionCard` and existing `rei-surface` cards.
- New accordion in `src/pages/Rei.tsx` directly below "Referrals & Points".
- `src/hooks/useReferralLeaderboard.ts` — React Query wrapper over the edge function, 60s refetch, reuses identity from `useReferralAndPoints`.
- Article embed: leaderboard mounted on the `/articles/refer-to-earn-with-rei-ai` page below the pot table (React section around the existing iframe, not inside the static HTML).

**Out of scope**: automatic payouts. The snapshot stores percentages only; payouts stay manual.
