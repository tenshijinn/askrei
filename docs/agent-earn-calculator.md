# Rei Earn Calculator — Hermes Agent Integration

Internal HTTP API that runs the same bounty → DeFi backtest as **https://rei.chat/earn** and can mint a branded share card (PNG + public share link) for posting on X.

## Base URL

```
https://qajahmmzqhgboeoorfqj.supabase.co/functions/v1/earn-agent
```

## Headers (all requests)

| Header | Value |
|---|---|
| `apikey` | `<SUPABASE_ANON_KEY>` |
| `Authorization` | `Bearer <SUPABASE_ANON_KEY>` |
| `x-internal-key` | the private Rei internal key (never publish this) |
| `Content-Type` | `application/json` (POST only) |

No key or a wrong key → `401`. Limit: **60 requests/minute** → `429`.

## Routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/options` | Valid inputs — call this first, never guess values |
| POST | `/calculate` | Run the backtest |
| POST | `/share` | Backtest + share card PNG + `rei.chat/s/<id>` link |
| GET | `/health` | Liveness |

### GET /options

```json
{
  "platforms": [
    { "name": "Jito", "assets": ["SOL"], "apy_percent": { "SOL": 8 },
      "yield_note": "avg staking yield", "x_handle": "@jito" }
  ],
  "frequencies": ["Weekly", "Bi-Weekly", "Monthly"],
  "periods": [{ "value": "cycle", "label": "Bear bottom → Bull top" },
              { "value": "12", "label": "Last 12 months" }],
  "defi_assets": [{ "sym": "SOL", "name": "Solana (SOL)" }],
  "buy_and_hold_tokens": [{ "sym": "JUP", "name": "Jupiter" }],
  "disclaimer": "..."
}
```

### POST /calculate

Request:

```json
{
  "asset": "SOL",
  "platform": "Jito",
  "amount": 500,
  "frequency": "Monthly",
  "period": "24",
  "share": false,
  "include_series": true
}
```

- `asset` — required. For DeFi mode, one of the platform's `assets`. For buy & hold, any symbol from `buy_and_hold_tokens`.
- `platform` — omit (or `null`) for **buy & hold**; set it for **stake/lend** mode.
- `amount` — USD value of one bounty (1 – 1,000,000).
- `frequency` — `Weekly` | `Bi-Weekly` | `Monthly`.
- `period` — `cycle` (bear bottom → bull top) or `6`,`12`,`18`,`24`,`30`,`36`,`42`,`48`.
- `share` — `true` to also mint the share card in the same call.
- `include_series` — `false` to drop the per-month array.

Response:

```json
{
  "mode": "defi",
  "asset": "SOL",
  "asset_name": "Solana (SOL)",
  "platform": "Jito",
  "platform_handle": "@jito",
  "amount": 500,
  "frequency": "Monthly",
  "period": "24",
  "window_label": "Last 24 months (Aug 2024 → Jul 2026)",
  "months": 24,
  "apy_percent": 8,
  "yield_note": "avg staking yield",
  "monthly_contribution": 500,
  "invested": 12000,
  "final_value": 18450,
  "profit": 6450,
  "multiple": 1.54,
  "monthly_series": [{ "month": "Aug 2024", "contributed": 500, "value": 512 }],
  "summary": "If you earned a $500 bounty per month and invested it into $SOL on Jito ...",
  "post_text": "My estimated earnings is $18,450 from crypto bounties ...",
  "prices_synced_at": "2026-08-15T09:00:00.000Z",
  "disclaimer": "Historical backtest using real monthly closes and representative average yields. Not financial advice."
}
```

### POST /share

Same body as `/calculate`. Adds:

```json
{
  "share_id": "k7Qm2xTb",
  "share_url": "https://rei.chat/s/k7Qm2xTb",
  "image_url": "https://qajahmmzqhgboeoorfqj.supabase.co/functions/v1/share-card/image?id=k7Qm2xTb",
  "post_text": "..."
}
```

- `image_url` — 1200×630 PNG, attach it to the post (no auth needed).
- `share_url` — clean rei.chat page that reopens the calculator with these inputs.
- `image_url` is `null` if card rendering failed; the numbers and `share_url` are still valid.

## How the agent should post

1. `GET /options` (cache for the session).
2. `POST /share` with the scenario the conversation implies.
3. Post `post_text`, attach `image_url`, and link `share_url`.
4. Always keep the "backtest / not financial advice" framing from `disclaimer`.

## Errors

| Status | Meaning |
|---|---|
| 400 | Bad input (unknown platform, unsupported asset for that platform, bad amount/frequency/period, no price history) — the `error` string says exactly what to fix |
| 401 | Missing/invalid `x-internal-key` |
| 404 | Unknown route |
| 429 | Rate limit (60/min) |
| 500/503 | Upstream market data or config problem — retry once, then skip |

## Examples

```bash
BASE="https://qajahmmzqhgboeoorfqj.supabase.co/functions/v1/earn-agent"
ANON="<anon key>"
KEY="<internal key>"
H=(-H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "x-internal-key: $KEY" -H "Content-Type: application/json")

# valid inputs
curl -s "$BASE/options" "${H[@]}"

# $500/month bounty staked as SOL on Jito over 24 months
curl -s -X POST "$BASE/calculate" "${H[@]}" \
  -d '{"asset":"SOL","platform":"Jito","amount":500,"frequency":"Monthly","period":"24"}'

# buy & hold JUP through the full cycle, with a share card
curl -s -X POST "$BASE/share" "${H[@]}" \
  -d '{"asset":"JUP","amount":250,"frequency":"Weekly","period":"cycle"}'
```

## Share card art (Aug 2026)

The card returned by `/share` is now the same design as the one users generate on
/earn (diagonal art panel, asset + platform logos, big % headline, value vs
contribution sparkline), and the background art is chosen automatically from the
inputs:

- SOL + any DeFi platform (and buy & hold of SOL) → default Rei art
- USDC / USDT / wBTC / wETH + a platform → that platform's dedicated art
- custom token (buy & hold) → one of 10 variations, picked deterministically

Nothing changes in the request or response contract — same routes, same fields.
The agent just keeps using `image_url` from `/share`; art and framing are handled
server-side. Cards are immutable per `share_id`, so call `/share` again for a new
one instead of re-fetching an old `image_url` expecting new art.
