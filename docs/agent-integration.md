# Rei Public Feed — Agent Integration Guide

A read-only HTTP API for external agents (Rei / OpenClaw, automations, partners) to access **public** Rei content: active tasks, active jobs, and skill categories. No user PII is ever returned.

## Base URL

```
https://qajahmmzqhgboeoorfqj.supabase.co/functions/v1/public-feed
```

## Auth

Two headers:

| Header | Required | Value |
|---|---|---|
| `Authorization` | yes | `Bearer <SUPABASE_ANON_KEY>` |
| `apikey` | yes | `<SUPABASE_ANON_KEY>` |
| `x-api-key` | only if gating is enabled | A key from `REI_AGENT_API_KEYS` |

Anon key (publishable, safe to ship in agent config):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhamFobW16cWhnYm9lb29yZnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1ODAzOTksImV4cCI6MjA5MTE1NjM5OX0.vuTVyufnNcRlKvSWMoVKr7fbEfNFlAjF9Peq8d1LZgE
```

To restrict to specific agents, set the `REI_AGENT_API_KEYS` secret (comma-separated). When set, every request must include a matching `x-api-key`. When unset, the endpoint is open to anyone with the anon key.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/tasks` | List active tasks |
| GET | `/tasks/:id` | Get one task |
| GET | `/jobs` | List active jobs |
| GET | `/jobs/:id` | Get one job |
| GET | `/skill-categories` | Full taxonomy |
| GET | `/feed` | Combined tasks + jobs, newest first (best for polling) |
| GET | `/health` | Self-describing healthcheck |

### Common list query params

| Param | Type | Notes |
|---|---|---|
| `limit` | int | 1–100, default 25 |
| `offset` | int | default 0 |
| `q` | string | Case-insensitive match on title / description / company_name |
| `role` | string | Matches an entry in `role_tags` (e.g. `developer`) |
| `skill_category_id` | uuid | Matches an entry in `skill_category_ids` |
| `since` | ISO timestamp | Returns rows where `created_at > since` (incremental sync) |

### Response shape

```json
{
  "data": [ { ... } ],
  "count": 142,
  "next_cursor": "2026-04-29T12:34:56.000Z",
  "limit": 25,
  "offset": 0
}
```

For incremental polling, store the most recent `created_at` you've seen and pass it as `since` next time.

## Field dictionary

### Task
`id, title, description, link, role_tags[], compensation, og_image, source, company_name, end_date, opportunity_type, skill_category_ids[], created_at, updated_at`

### Job
`id, title, description, requirements, link, apply_url, role_tags[], compensation, og_image, source, company_name, deadline, expires_at, opportunity_type, skill_category_ids[], created_at, updated_at`

### Skill category
`id, name, description, keywords[], parent_category_id, task_count, job_count, talent_count`

### Fields the agent will NEVER see
`employer_wallet`, `payment_tx_signature`, `solana_pay_reference`, `external_id`, `campaign_subscription_id`, anything from `rei_registry` (talent profiles), `chat_*`, `payment_*`, `subscriptions`, `referral_*`, `user_points`, `twitter_whitelist*`.

## Examples

```bash
ANON="eyJhbGciOi..."   # anon key

# Latest 10 tasks
curl -s "https://qajahmmzqhgboeoorfqj.supabase.co/functions/v1/public-feed/tasks?limit=10" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"

# Search jobs for "rust"
curl -s "https://.../public-feed/jobs?q=rust&limit=20" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"

# Combined incremental feed since last sync
curl -s "https://.../public-feed/feed?since=2026-04-29T00:00:00Z&limit=50" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```

## Security model

- Data is served from two security-invoker views (`v_public_tasks`, `v_public_jobs`) that whitelist columns and filter to active, non-expired rows.
- The edge function uses the service role internally but is hard-coded to read only those views + `skill_categories`.
- No write endpoints. No talent profile access. No authentication-state leakage.
- CORS is open because everything returned is already public.
- Optional per-agent `x-api-key` gating allows revocation without redeploys.

## Operational notes

- Cap of 100 rows per call; use `since` cursors for sync.
- The endpoint runs on Supabase Edge Functions (auto-scaled, global).
- For high-throughput consumers, prefer `/feed?since=...` polled every 30–60s over heavy `/tasks` + `/jobs` scans.
