# Fix x402 SOL price inaccuracy

## Problem

The $5 charge was converted using a SOL price of **$86.27/SOL**, producing 0.057958 SOL. The math is correct ($5 / $86.27 ≈ 0.0580), so the bug is the **price source**, not the conversion. Real SOL price is significantly higher, so the user is being undercharged (or, in a spike, overcharged).

Root cause is in `supabase/functions/x402-create-payment/index.ts`:

- The only price oracle is **CoinGecko's free public endpoint**, which is frequently rate-limited, cached, or returns stale values on Supabase Edge runtimes.
- The sanity check accepts any price between `$10` and `$1000`, so an obviously wrong $86 slips through.
- The fallback when all retries fail is a **hardcoded $100**, which is also wrong and silently miscalculates real money.

The same single-source pattern would silently misprice every future payment.

## Fix

Replace the single CoinGecko call with a **multi-source price oracle** that prefers on-chain / professional feeds and only falls back to CoinGecko. Refuse to create the payment if no source returns a trustworthy price — never fall back to a hardcoded constant for real charges.

### Price sources (in order)

1. **Jupiter Price API v2** (`https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112`) — fast, free, aggregated DEX price, no key.
2. **Pyth Hermes** (`https://hermes.pyth.network/v2/updates/price/latest?ids[]=<SOL/USD feed id>`) — on-chain oracle, no key.
3. **CoinGecko** — current behavior, last resort.

For each source: 5s timeout, parse, validate. Use the **median** of whichever sources responded successfully (at least 1). If 2+ sources disagree by more than ~3%, log a warning and use the median anyway.

### Sanity check

- Reject any single source price outside a wide safety band (e.g. `$20`–`$2000`) — wide enough to survive real market moves, narrow enough to catch obvious garbage like an $86 stale value when the real price is far higher. Tune later if needed.
- If **no** source produced a valid price, return HTTP 503 with a clear error so the client shows "price feed unavailable, try again" rather than silently charging the wrong amount.

### Other small cleanups

- Log which source(s) succeeded and the chosen price for auditability.
- Keep all existing schema / transaction / DB code unchanged.

## Files touched

- `supabase/functions/x402-create-payment/index.ts` — replace the CoinGecko-only block (lines ~46–117) with the multi-source fetcher; remove the hardcoded `$100` fallback; surface a clean error on total failure.

No frontend, schema, or other edge function changes needed. `x402-verify-payment` already verifies the stored `solAmount`, so the corrected price flows through automatically.

## Out of scope

- Caching SOL price across requests (can add later if rate limits bite).
- Switching the charge unit away from SOL.
- Touching other payment flows (Solana Pay QR, Stripe).
