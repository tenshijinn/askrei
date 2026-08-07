# /earn bounty calculator — API cost per calculation

Reference for what the Bounty Earning Calculator (`/earn`) costs to run, per upstream
provider and per user calculation. Documentation only — no runtime code reads this file.

Figures below are **public list prices** as of **2026-08-07**. Call counts are derived from
the current code (`supabase/functions/earn-market/index.ts`, `src/components/earn/BountyDefiCard.tsx`)
with `MONTHS_BACK = 48`, `DB_TTL_MS = 24h`, `MEM_TTL_MS = 1h`, Coinbase paged in 299-day
chunks, CoinGecko 2 pages x 250, CMC `limit=500`, `warm` default 60 tokens.

---

## 1. Call map — what each user action triggers

Every calculation is math on already-fetched series (`computeSeries` in
`src/components/earn/data.ts`), executed in the browser. Upstream calls only happen on a
**cache miss**, never per slider change.

| User action | `earn-market` action | Upstream calls on cold cache |
|---|---|---|
| Page load, DeFi mode | `prices` | Coinbase candles: 3 products (SOL/ETH/BTC) x 5-6 paged requests = **15-18 calls** |
| Page load (always) | `tokens` | CoinGecko `coins/markets` x2 pages + CMC `listings/latest` x1 = **2 CG + 1 CMC** |
| NLO platform selected | `nlo` | Firecrawl `/v2/scrape` **x1 per calendar day**; falls back to 1 free plain-HTML GET |
| Switching to a token | `history` | CoinGecko `market_chart` 1-3 tries → else Coinbase (~5-6) → else CMC historical x1 |
| Daily cron | `warm` | `tokens` (3 calls) + up to 60 x `history` (≈60-90 calls, 1.5s spaced) |
| Share card view | `share-card` | none (no upstream provider) |

Slider moves, period changes, platform switches, frequency changes: **0 upstream calls**.

---

## 2. Cache layers

```text
browser ──► earn-market
              ├─ 1h  in-memory Map (per isolate)          → 0 calls, 0 DB reads
              ├─ 24h earn_market_cache (Postgres)          → 0 calls, 1 DB read
              └─ miss → provider chain (CG → Coinbase → CMC)
daily cron: action=warm  → pre-fills tokens + top-60 histories before users arrive
```

Because `warm` runs daily and `DB_TTL_MS` is 24h, the common path for a real visitor is a
**memory or DB hit**: zero provider calls, zero marginal provider cost.

---

## 3. Per-call price table

| Provider | Endpoint used | Free tier | Paid list price | Effective $/call (paid) |
|---|---|---|---|---|
| Coinbase Exchange | `/products/{id}-USD/candles` | Public, unauthenticated, ~10 req/s | n/a — no paid market-data tier | **$0.00** |
| CoinGecko | `coins/markets`, `coins/{id}/market_chart` | Demo: 30 calls/min, 10k calls/mo | Analyst $129/mo, 500k calls/mo | **≈$0.00026** |
| CoinMarketCap | `v1/cryptocurrency/listings/latest` (1 credit / 200 items → `limit=500` = 3 credits), `v2/.../quotes/historical` (1 credit / 100 data points → 48 monthly points = 1 credit) | Basic: 10k credits/mo, historical **not** included | Hobbyist $29/mo / 40k credits | **≈$0.000725 / credit** |
| Firecrawl | `POST /v2/scrape` (1 credit per page) | 500 one-off credits | Hobby $19/mo / 3,000 credits | **≈$0.0063 / scrape** |
| nlo.finance | `GET /live` (HTML fallback) | Public page | n/a | **$0.00** |
| Lovable Cloud | edge invocation + `earn_market_cache` read/write | Included in plan | Included | **not billed per call** |

CoinGecko free/Demo is what the code actually uses today (no key sent on
`coins/markets` / `market_chart`), so its real cost today is **$0.00** with a 10k/mo ceiling.

---

## 4. Cost per calculation

**DeFi platform mode** (Jito, Kamino, Marinade, marginfi, NLO — SOL/BTC/ETH/USDC/USDT series):

| Cache state | Providers hit | Cost, current (free CG) | Cost, all-paid tiers |
|---|---|---|---|
| Steady state (memory hit) | none | **$0.00** | **$0.00** |
| Warm (24h DB hit) | none | **$0.00** | **$0.00** |
| Cold — non-NLO platform | Coinbase 15-18 + CG 2 + CMC 3 credits | **≈$0.0022** (CMC only) | **≈$0.0027** |
| Cold — NLO selected | above + 1 Firecrawl scrape | **≈$0.0085** | **≈$0.0090** |

NLO adds at most one Firecrawl scrape per calendar day across **all** users (samples are
keyed by date in `nlo:samples`), so per-calculation it amortises to ~$0.0063 / daily NLO users.

**Token mode:**

| Cache state | Providers hit | Cost, current | Cost, all-paid tiers |
|---|---|---|---|
| Token in the warmed top-60 | none | **$0.00** | **$0.00** |
| Cold, CoinGecko succeeds | 1-3 CG `market_chart` | **$0.00** | **≈$0.0003-0.0008** |
| Cold, Coinbase fallback | 1-3 CG + 5-6 Coinbase | **$0.00** | **≈$0.0008** |
| Cold, CMC fallback (long-tail token) | 1-3 CG + 1 CMC historical credit | **≈$0.0007** | **≈$0.0015** |

Practical read: **a calculation costs nothing.** Cost is attached to *first-ever fetch of a
series*, and the daily warmer moves almost all of that into a fixed, predictable cron cost.

---

## 5. Monthly projection

Assumptions: `warm` runs once daily at `limit=60`; ~90% of user history requests hit the
warmed set; ~500 cold long-tail token lookups/month; NLO scraped once daily.

| Line item | Volume / month | Cost, current | Cost, all-paid tiers |
|---|---|---|---|
| `warm` cron — token list | 30 x (2 CG + 3 CMC credits) | ≈$0.07 | ≈$0.09 |
| `warm` cron — 60 histories | ≈1,800-2,700 calls (mostly CG + Coinbase) | ≈$0.00-0.60 | ≈$0.60 |
| `prices` refresh | ≈30 x 18 Coinbase | $0.00 | $0.00 |
| NLO Firecrawl | 30 scrapes | ≈$0.19 | ≈$0.19 |
| Cold long-tail tokens | ≈500 lookups, ~10% CMC | ≈$0.04 | ≈$0.40 |
| **Total** | | **≈$0.30 / month** | **≈$1.30 / month** |

Free-tier headroom:

- **CoinGecko Demo (10k calls/mo)** — currently ≈2,600-3,300 calls/mo. First ceiling you'd hit;
  raising `warm` past `limit≈150`, or shortening `DB_TTL_MS` below ~12h, pushes past 10k.
- **CMC Basic (10k credits/mo)** — ≈150 credits/mo used, but Basic **excludes**
  `quotes/historical`, so the CMC history fallback already requires Hobbyist ($29/mo) to work.
- **Firecrawl** — 30 credits/mo; the 500 one-off credits last ~16 months before Hobby is needed.
- **Coinbase** — unmetered, only rate-limited; the 1.5s spacing in `warm` keeps it clear.

---

## 6. Assumptions and caveats

- Prices are provider-published list prices on 2026-08-07 and change without notice.
- CMC credit costs per endpoint come from CMC's credit table (1 credit per 200 listing items,
  1 credit per 100 historical data points); a `limit=500` listing = 3 credits, a 48-month
  historical pull = 1 credit.
- CoinGecko paid $/call is plan price ÷ included monthly calls, not a metered rate — real
  marginal cost on a paid plan is $0 until the plan cap is exceeded.
- Numbers shift if any of these change: `warm` `limit` (default 60), `MONTHS_BACK` (48),
  `DB_TTL_MS` (24h), `MEM_TTL_MS` (1h), `COINBASE_SYMS` coverage, or the cron schedule.
- Edge function invocations, Postgres reads/writes and storage for share cards are covered by
  the Lovable Cloud plan and are not itemised per call here.
