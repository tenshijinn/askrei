# Project architecture

- Keep the public Diamond scanner's rolling-week allowance in `supabase/functions/_shared/diamonds/scan-quota.ts`, shared by the function, UI and tests, so the advertised limit matches enforcement.
- Store complete, validated live Diamond reports with original timestamps in device history; reopen without rescoring or consuming quota, and preserve case sensitivity for Solana addresses to avoid mixing wallets.
- Keep Diamond scanner presentation in `src/components/diamond/` and its semantic visual tokens in global CSS, leaving the existing wallet-scoring engine as the sole source of scores and evidence.- Keep bounty platform display names in `supabase/functions/_shared/bounty-platforms.ts`, shared by ingestion and UI; platform slugs stay raw in `role_tags` so existing filters and agent queries keep working.

- Keep the home page average-bounty calculation (sample window, which rewards count as dollars) in `src/lib/bountyAverage.ts`, so the card and its tests share one definition; retired hero cards go to `archive/`, not deleted.
