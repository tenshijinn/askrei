# Cost per calculation — /earn bounty calculator

Add a reference doc, `docs/earn-api-costs.md`, that itemises every upstream API the /earn calculator depends on, the cost per call at public list prices, and the resulting cost per calculation for the two modes (DeFi platform vs. Token).

No code or UI changes — documentation only.

## What the doc will contain

### 1. Call map per user action
Traced from `earn-market` and `BountyDefiCard`:

| User action | Function action | Upstream calls when cache misses |
|---|---|---|
| Page load (DeFi mode) | `prices` | Coinbase candles: 3 products x 6 paged requests = ~18 calls |
| Page load | `tokens` | CoinGecko markets x2 pages + CoinMarketCap listings x1 |
| Page load (NLO selected) | `nlo` | Firecrawl scrape x1/day (HTML fallback free) |
| Switching token | `history` | CoinGecko market_chart 1-3 tries, else Coinbase (~6) else CMC x1 |
| Cron warmer | `warm` | tokens + up to 60 histories |

### 2. Cache layers that make most calculations cost $0
- 1h in-memory per isolate
- 24h persistent `earn_market_cache` (Postgres)
- daily `warm` cron pre-fills token list + top-60 histories
The doc states plainly: a steady-state calculation (any slider/period/platform change) triggers **zero** upstream calls — all math is client-side; only a cold cache miss costs anything.

### 3. Per-call price table (public list prices, dated, with source noted)
- Coinbase Exchange public candles — free, rate-limited (10 req/s public)
- CoinGecko free/Demo — free, 30 calls/min, 10k calls/month cap; Analyst tier listed as the paid comparison ($/month ÷ included calls = $/call)
- CoinMarketCap — credit-based: Basic free (10k credits/mo), Hobbyist / Startup / Standard monthly price ÷ credits = $/credit; listings & historical quote credit costs noted
- Firecrawl — per-scrape credit; Hobby/Standard plan price ÷ credits = $/scrape
- NLO plain HTML fallback — free
- Lovable Cloud edge function invocation + DB read/write — noted as platform-included, not per-call billed

### 4. Cost per calculation table
Three columns: cold (all caches empty), warm (24h cache hit), steady-state (in-memory hit), for each of:
- DeFi platform mode (Jito / Kamino / Marinade / marginfi / NLO)
- Token mode (cached token vs. uncached long-tail token)

Plus a monthly projection: daily `warm` cron cost + estimated cache-miss traffic, and the free-tier headroom (which providers you stay inside on free plans, and the first one that would push you to paid).

### 5. Assumptions and caveats
Explicit note that prices are published list prices as of the doc date, credits-per-endpoint come from provider docs, and figures change if the `warm` limit, `MONTHS_BACK` (48), or `DB_TTL_MS` (24h) are changed.

## Technical notes
- Single new file: `docs/earn-api-costs.md`.
- All call counts derived from the current code (`MONTHS_BACK = 48`, 299-day Coinbase paging, CoinGecko 2 pages of 250, CMC `limit=500`, warm default 60 tokens with 1.5s spacing).
