# Expose the /earn calculator to the Hermes agent

Give Hermes a small HTTP API that runs the same bounty→DeFi backtest the /earn page runs, and returns both a share link and a real PNG image URL it can attach to a post.

## What gets built

### 1. Shared calculation module
Move the backtest math (asset price series, platform APYs, contribution cadence, window resolution, compounding loop) into a backend-shared module so the edge function computes exactly what the page shows. Live prices/token history keep coming from the existing `earn-market` cache, so agent results match the UI.

### 2. New endpoint: `earn-agent`
One function, three routes:

- `GET /earn-agent/options` — the menu of valid inputs: supported assets/tokens, platforms with their APY per asset, frequencies (Weekly / Bi-Weekly / Monthly), and period options (`12`, `24`, `36`, `48`, `cycle`). Hermes calls this first so it never guesses a value.
- `POST /earn-agent/calculate` — takes `asset`, `platform`, `amount`, `frequency`, `period`, returns the full result: invested, final value, profit, multiple, APY used, window label, per-month value/contribution series, and a plain-English summary sentence.
- `POST /earn-agent/share` — same inputs, runs the calculation, renders a share card PNG server-side, stores it in the existing `earn-share-cards` bucket, writes an `earn_shares` row, and returns:
  - `share_url` — `https://rei.chat/s/<id>` (the on-domain share page, with correct OG tags)
  - `image_url` — direct PNG for the agent to attach
  - `post_text` — ready-to-post copy with the numbers and $SYM/platform handles

`calculate` can also be asked to include the share in one call (`share: true`) so Hermes gets numbers + card in a single request.

### 3. Server-rendered share card
The current card is rendered in the browser (html-to-image), which an agent can't do. The endpoint renders its own card server-side (JSX → SVG → PNG via satori + resvg) using the same layout language as the on-page card: Rei branding, asset + platform, amount/cadence, window label, invested vs final value, profit multiple. Output is 1200×630 so it works as a Twitter/OG image.

### 4. Auth: internal key only
The endpoint requires a private header key held only by Hermes, stored as a project secret (`REI_AGENT_INTERNAL_KEY`). No public/sellable keys, no user data touched — the calculator reads only market data. Basic per-key rate limiting (e.g. 60 req/min) and `verify_jwt = false` so the raw header is what gates access.

## Technical notes

- New: `supabase/functions/earn-agent/index.ts`, `supabase/functions/_shared/earn-calc.ts`, `supabase/functions/_shared/earn-card.tsx`.
- `src/components/earn/data.ts` stays the source of truth for platform/APY/frequency constants; the shared backend module mirrors them (single copy in `_shared`, imported by the function).
- `earn-share` and `/s/:id` are reused unchanged for storage and the public share page, so agent-made cards behave like user-made ones.
- `supabase/config.toml` gets `[functions.earn-agent] verify_jwt = false`.
- Endpoint validated with the test tool after deploy (options → calculate → share, and a 401 check without the key).

## Instructions handed to Hermes

After it ships you'll get a copy-paste block for the agent, containing:

- Base URL and the two required headers (`apikey`/`Authorization` anon + `x-internal-key`).
- The three routes with exact JSON request/response shapes.
- The rule to call `/options` first and only use returned values.
- Example: "compound a $500 monthly bounty income into SOL on Jito over 24 months" → request body → response fields → how to build the post using `post_text` + `image_url` + `share_url`.
- Rate limit, error codes, and the disclaimer line to include (backtest, not financial advice).

This will also be saved to `docs/agent-earn-calculator.md` in the repo.
