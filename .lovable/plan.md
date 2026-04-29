## Goal

A new sales/landing page at **`/agents`** that sells AI agents (and the developers behind them) **read-only access** to Rei's public database of tasks, jobs, bounties, and skill categories — paid per call (or per key) via **x402 on Solana**. Inspired by superteam.fun/earn/agents, but speaks to AI agents as the ICP, with our manga/terminal aesthetic.

## Page structure (`/agents` — parallax/snap, same shell as `/joinrei`)

Reuses `rei-theme h-screen overflow-y-scroll snap-y snap-mandatory` pattern with new section components under `src/components/agents/`.

```text
1. AgentsHero            — "Let your agents discover crypto work."
                           CTAs: [Get API Key] [Read the docs]
                           Right side: Rei hero image + animated terminal mock (curl call)
2. LogoBar               — reuse existing LogoBar (Galxe/Zealy/etc — sources synced)
3. AgentsValueProp       — 3 cards: Read-only • Public-only • Pay-per-use (x402)
4. AgentsEndpoints       — Visual list of endpoints (/tasks /jobs /skill-categories /feed)
                           with example JSON response + copy buttons
5. AgentsHowItWorks      — 4 steps: Buy key → Call endpoint → Get JSON → Agent acts
6. AgentsCodeDemo        — Tabbed code samples (curl / TypeScript / Python) hitting
                           the public-feed function with x-api-key header
7. AgentsCompliance      — "Sync, don't scrape" + safety: no PII, whitelisted columns,
                           rate-limited, revocable keys
8. AgentsPricing         — x402 pricing tiers (see below); each CTA triggers x402 flow
```

## Pricing tiers (x402, USD priced, settled in SOL)

| Tier              | Price   | What you get                                      |
|-------------------|---------|---------------------------------------------------|
| Pay-as-you-go     | $0.001/call | Single API key, 60 req/min, all read endpoints |
| Agent Starter     | $25 / 30 days unlimited | 1 key, 300 req/min, `/feed` polling   |
| Agent Pro         | $99 / 30 days unlimited | 5 keys, 1000 req/min, priority routing, webhook on new tasks (later) |

All purchased via the existing `X402Payment` component → on success we mint a key and store it.

## Backend changes

### New table `agent_api_keys`
```sql
create table public.agent_api_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,        -- sha256 of the raw key
  key_prefix text not null,             -- first 8 chars for display
  label text,
  buyer_wallet text not null,
  tier text not null,                   -- 'payg' | 'starter' | 'pro'
  rate_limit_per_min int not null default 60,
  expires_at timestamptz,               -- null for payg
  payment_tx_signature text not null,
  payment_reference text,
  revoked boolean not null default false,
  created_at timestamptz default now(),
  last_used_at timestamptz
);
-- RLS: buyer can SELECT own keys (by buyer_wallet jwt claim); service role manages.

create table public.agent_api_usage (
  id bigserial primary key,
  api_key_id uuid references public.agent_api_keys(id) on delete cascade,
  endpoint text not null,
  status int not null,
  ts timestamptz default now()
);
create index on public.agent_api_usage(api_key_id, ts desc);
```

### Updated edge function `public-feed`
- Continue accepting the legacy `REI_AGENT_API_KEYS` env-secret keys (Rei/OpenClaw internal).
- **Also** accept hashed keys from `agent_api_keys`: sha256 the incoming `x-api-key`, look up, check `expires_at`/`revoked`, enforce tier rate-limit (in-memory token bucket per key), log to `agent_api_usage`, update `last_used_at`.

### New edge function `agents-issue-key`
- Inputs: `{ tier, payment_reference, label? }`, JWT carries `wallet_address`.
- Verifies the `payment_references` row matches tier price + status `verified` + payer = wallet.
- Generates `rei_live_<32 hex>`, stores sha256, returns the raw key **once**.

### New edge function `agents-list-keys`
- Lists buyer's keys (prefix + tier + usage count + expires_at). No raw keys.

## Frontend wiring

- **Route**: add `<Route path="/agents" element={<Agents />} />` in `src/App.tsx`.
- **Page**: `src/pages/Agents.tsx` composing the new sections.
- **Pricing CTAs**: open a modal with `<X402Payment amount={price} memo="agent-key:<tier>" />` → on success call `agents-issue-key` → show the raw key once with copy + warning.
- **Dashboard sliver** (in the same modal after issuance): "Your keys" list via `agents-list-keys`.
- **Docs link**: button → `/docs/agent-integration.md` (already exists in repo) or open in new tab to a hosted version.

## Copy direction (ICP = AI agents / agent devs)

- Hero: *"Plug your agent into the largest cross-chain index of Web3 tasks, bounties & jobs."*
- Value: *"One endpoint. JSON in, work out. Pay only for what your agent reads."*
- Compliance: *"We sync sources legally so your agent doesn't have to scrape."*

## Out of scope (call out for follow-up)

- Webhook / push delivery of new tasks (Pro tier teaser only)
- Per-agent dashboard page
- MCP server wrapper

## Files to create / edit

**Create**
- `src/pages/Agents.tsx`
- `src/components/agents/AgentsHero.tsx`
- `src/components/agents/AgentsValueProp.tsx`
- `src/components/agents/AgentsEndpoints.tsx`
- `src/components/agents/AgentsHowItWorks.tsx`
- `src/components/agents/AgentsCodeDemo.tsx`
- `src/components/agents/AgentsCompliance.tsx`
- `src/components/agents/AgentsPricing.tsx`
- `supabase/functions/agents-issue-key/index.ts`
- `supabase/functions/agents-list-keys/index.ts`
- Migration for `agent_api_keys` + `agent_api_usage` (+ RLS)

**Edit**
- `src/App.tsx` — add `/agents` route
- `supabase/functions/public-feed/index.ts` — DB-backed key validation + rate limit + usage log
- `docs/agent-integration.md` — add "Buy your own key at /agents" section
