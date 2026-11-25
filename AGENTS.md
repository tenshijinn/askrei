# Project architecture

- Keep the public Diamond scanner's rolling-week allowance in `supabase/functions/_shared/diamonds/scan-quota.ts`, shared by the function, UI and tests, so the advertised limit matches enforcement.
- Store complete, validated live Diamond reports with original timestamps in device history; reopen without rescoring or consuming quota, and preserve case sensitivity for Solana addresses to avoid mixing wallets.
- Keep Diamond scanner presentation in `src/components/diamond/` and its semantic visual tokens in global CSS, leaving the existing wallet-scoring engine as the sole source of scores and evidence.