## Goal

Give Rei (OpenClaw / external agent) a stable, **read-only, public-content-only** way to access listed `tasks`, `jobs`, community-shared opportunities, and skill taxonomy — with zero exposure of user PII (wallets, emails, talent profiles, drafts, payments).

## What's already public-safe vs private

Current RLS posture (verified):

| Table | Public read? | Notes |
|---|---|---|
| `tasks` | yes — `status='active'` | Safe to expose. Contains `employer_wallet` + `payment_tx_signature` columns we must strip. |
| `jobs` | yes — `status='active'` | Same — strip `employer_wallet`, `payment_tx_signature`. |
| `skill_categories` | yes — open | Safe as-is. |
| `community_submissions` | private (admin / submitter only) | Don't expose raw. Only expose items that have been **promoted** into `tasks`/`jobs` (already covered). |
| `rei_registry` (talent) | private (owner / paid employer / admin) | **Never expose.** Out of scope for the public agent API. |
| `user_points`, `chat_*`, `payment_*`, `referral_*`, `subscriptions`, `talent_views`, `twitter_whitelist*`, `admin_audit_log` | private | **Never expose.** |

So the public surface area is: **active tasks, active jobs, skill categories** — plus simple search/filter on top.

## Architecture

```text
┌──────────────┐    HTTPS + (optional API key)    ┌────────────────────────┐
│ Rei / Agent  │ ───────────────────────────────► │ Edge Function:         │
│ (OpenClaw)   │                                  │ public-feed            │
└──────────────┘                                  │ (verify_jwt = false)   │
                                                  └─────────┬──────────────┘
                                                            │ service role
                                                            ▼
                                            ┌──────────────────────────────┐
                                            │ Supabase (public-safe views) │
                                            │  v_public_tasks              │
                                            │  v_public_jobs               │
                                            │  skill_categories            │
                                            └──────────────────────────────┘
```

Two delivery options, both backed by the same views. Pick one (or both):

- **A. REST endpoints** under one edge function — easiest for any agent / cron / webhook consumer.
- **B. MCP server** (mcp-lite on Supabase Edge Functions) — plug-and-play for Claude / Claw-style agents that speak MCP.

Recommendation: ship **A first** (universal), add **B** on top later if you want native MCP tool-calling.

## Step 1 — Public-safe SQL views (migration)

Create views that whitelist columns and hide wallets / payment signatures. Views inherit the underlying RLS, but we'll explicitly filter `status='active'` and time-bound `end_date`/`expires_at`.

```sql
create or replace view public.v_public_tasks as
select
  id, title, description, link, role_tags, compensation,
  og_image, source, company_name, end_date,
  opportunity_type, skill_category_ids, created_at, updated_at
from public.tasks
where status = 'active'
  and (end_date is null or end_date > now());

create or replace view public.v_public_jobs as
select
  id, title, description, requirements, role_tags, compensation,
  og_image, link, apply_url, source, company_name, deadline, expires_at,
  opportunity_type, skill_category_ids, created_at, updated_at
from public.jobs
where status = 'active'
  and (expires_at is null or expires_at > now());

grant select on public.v_public_tasks, public.v_public_jobs to anon, authenticated;
```

Excluded on purpose: `employer_wallet`, `payment_tx_signature`, `solana_pay_reference`, `external_id`, `campaign_subscription_id`.

## Step 2 — `public-feed` edge function (REST)

Single function, no JWT required, with optional `x-api-key` gate so we can rate-limit / revoke per agent.

Endpoints:

- `GET /tasks?limit=&offset=&q=&role=&skill_category_id=&since=`
- `GET /tasks/:id`
- `GET /jobs?limit=&offset=&q=&role=&skill_category_id=&since=`
- `GET /jobs/:id`
- `GET /skill-categories`
- `GET /feed?limit=&since=` — combined tasks+jobs sorted by `created_at desc` (best for a polling agent)

Rules:
- Read from `v_public_tasks` / `v_public_jobs` only.
- Cap `limit` at 100, default 25.
- `since` (ISO timestamp) → `created_at > since` for incremental sync.
- Always JSON, always CORS-open, never echo any column outside the view whitelist.
- Optional `REI_AGENT_API_KEYS` env var (comma-separated). If set, require matching `x-api-key` header.
- Response shape: `{ data: [...], next_cursor: string|null, count: number }`.

`supabase/config.toml` add:
```toml
[functions.public-feed]
verify_jwt = false
```

## Step 3 — Optional: MCP server for the agent

Add a second edge function `rei-mcp` using `mcp-lite` (per the MCP guide) that wraps the same views as MCP tools:

- `list_tasks(query?, role?, skill_category_id?, since?, limit?)`
- `get_task(id)`
- `list_jobs(...)`
- `get_job(id)`
- `list_skill_categories()`
- `feed(since?, limit?)`

Same auth model (header API key, no JWT). Agent connects via Streamable HTTP at `/functions/v1/rei-mcp`.

## Step 4 — Documentation for the agent operator

Add `docs/agent-integration.md` covering:
- Base URL: `https://qajahmmzqhgboeoorfqj.supabase.co/functions/v1/public-feed`
- Auth: anon key + optional `x-api-key`
- Endpoint reference + example responses
- Pagination via `since` cursor
- Field dictionary (with explicit "fields you will never see: wallets, tx signatures, emails")
- Rate / fair-use note
- MCP endpoint URL (if Step 3 shipped)

## Security checklist

- Views grant `select` only on whitelisted columns — wallets and tx signatures cannot leak.
- Edge function uses **service role internally** but only ever queries the views, never the base tables.
- No write endpoints. No talent / `rei_registry` exposure. No `chat_*` / `payment_*` / `subscriptions`.
- Optional per-agent API key lets you revoke access without a redeploy of consumers.
- CORS open is fine because data is already public.

## Out of scope (explicitly)

- Talent / Rei registry profiles (paid product — stays gated).
- Any user-identifying data, drafts, payments, referral codes, points.
- Write/submit endpoints (postToRei keeps its $5 SOL flow).

## Deliverables when you approve

1. Migration: `v_public_tasks`, `v_public_jobs` + grants.
2. Edge function `public-feed` with the 6 endpoints above + `config.toml` block.
3. (Optional toggle) Edge function `rei-mcp` using `mcp-lite`.
4. `docs/agent-integration.md` for the OpenClaw operator.
5. Optional `REI_AGENT_API_KEYS` secret you populate later in Cloud settings.
