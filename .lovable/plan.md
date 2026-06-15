## Fix 1 — Remove client-side CoinGecko call from PostToRei (promotions tab)

Currently `src/components/PostToRei.tsx` fetches the SOL/USD price directly from CoinGecko in the browser, then uses it for both Solana Pay QR and x402 preview. CoinGecko's free tier is unreliable and can return stale/wrong prices (likely cause of the $72.05/SOL display).

**Change:**
- Create a tiny new edge function `get-sol-price` (GET, no auth) that returns `{ price, sources }` using the existing Moralis-first `fetchSolPriceUsd()` oracle. This keeps pricing logic centralized server-side.
- In `PostToRei.tsx`, replace the CoinGecko fetch with `supabase.functions.invoke('get-sol-price')`. Everything else (QR URL, x402 handoff) stays the same.

No changes to existing endpoint names, request shapes, or the public feed — Hermes is unaffected.

## Fix 2 — Tighten the price oracle sanity bounds

In `supabase/functions/_shared/sol-price.ts`:
- Raise `MIN_SANE_PRICE` from `20` → `80` and lower `MAX_SANE_PRICE` from `2000` → `1000`. SOL has not traded outside this band in years; this stops a single bad oracle response (like $72) from sneaking through.
- When Moralis returns a price, cross-check it against one fallback source (Jupiter). If they disagree by >5%, discard Moralis and fall back to the median of Jupiter+Pyth+CoinGecko. This prevents a single bad primary source from being trusted blindly.
- Add `console.log` of the source name + price actually used, so the next time something looks off we can see exactly which oracle returned what (visible in `x402-create-payment` and `verify-solana-pay` logs).

## Files touched

- New: `supabase/functions/get-sol-price/index.ts`
- Edited: `supabase/functions/_shared/sol-price.ts`
- Edited: `src/components/PostToRei.tsx`

No database migrations. No changes to `x402-create-payment`, `verify-solana-pay`, `rei-chat`, or the public feed contract.