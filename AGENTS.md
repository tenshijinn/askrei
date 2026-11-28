# Project architecture

- Keep the public Diamond scanner's rolling-week allowance in `supabase/functions/_shared/diamonds/scan-quota.ts`, shared by the function, UI and tests, so the advertised limit matches enforcement.
- Store complete, validated live Diamond reports with original timestamps in device history; reopen without rescoring or consuming quota, and preserve case sensitivity for Solana addresses to avoid mixing wallets.
- Keep Diamond scanner presentation in `src/components/diamond/` and its semantic visual tokens in global CSS, leaving the existing wallet-scoring engine as the sole source of scores and evidence.- Keep bounty platform display names in `supabase/functions/_shared/bounty-platforms.ts`, shared by ingestion and UI; platform slugs stay raw in `role_tags` so existing filters and agent queries keep working.

- Keep the home page bounty calculations in `src/lib/bountyAverage.ts`, so the card and tests share reward parsing: the average uses the latest 100 public-feed rows, while the highest uses the entire paginated 30-day public feed; retired hero cards go to `archive/`, not deleted.
- Scope home-page grain to `.home-page` in global CSS and paint it as a static background layer, so text, media, interactions and other routes remain unaffected.
