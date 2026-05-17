# Expose Light Profile Data to the Rei Agent

Extend the existing `public-feed` edge function so the Rei agent can pull a *minimal, match-ready* profile for a registered X user. Just enough signal to recommend bounties — never enough to dox or contact the user off-platform.

## What changes

### 1. Enrich `/registered` (internal-only)

Already gated to `REI_AGENT_API_KEYS` holders (the Rei agent). Add the matching fields it needs:

Returned today:
`registered, x_user_id, handle, display_name, verified, has_profile_analysis, registered_at`

Add:
- `skills` — string array from `rei_registry.skills`
- `role_tags` — string array from `rei_registry.role_tags`
- `skill_category_ids` — uuid array (so the agent can pivot directly into `/tasks?skill_category_id=...`)
- `profile_score` — numeric (rough seniority/quality signal)
- `analysis_summary` — short text blurb (already a human-readable summary, safe to expose)
- `profile_image_url` — for chat UI avatars on X
- `top_categories` — server-side join: names of the skill categories matched by `skill_category_ids` (so the agent doesn't need a second call)

### 2. New endpoint: `GET /match` (internal-only)

Convenience endpoint the agent calls in one shot when a user DMs it on X:

```
GET /match?x_user_id=...&limit=10&kind=task|job|all
```

Server logic:
1. Look up the X user in `rei_registry` (by `x_user_id` or `handle`).
2. If not registered → `{ registered: false }` plus a CTA link to `https://rei.chat`.
3. If registered → return the light profile above *plus* a ranked list of currently active tasks/jobs whose `skill_category_ids` or `role_tags` intersect the user's. Newest first, capped at `limit` (max 25).

Response shape:
```json
{
  "registered": true,
  "profile": { handle, display_name, skills, role_tags, skill_category_ids, top_categories, profile_score, analysis_summary, profile_image_url, verified },
  "matches": [ { kind: "task", id, title, compensation, company_name, link, role_tags, skill_category_ids, created_at }, ... ],
  "count": 7
}
```

## What stays private (never exposed)

`wallet_address`, `file_path` (resume), `portfolio_url`, full `profile_analysis` JSON, `work_experience`, `nft_mint_address`, anything from `chat_*`, `payment_*`, `referral_*`, `user_points`, `twitter_whitelist*`. Same hard whitelist principle as the rest of `public-feed`.

## Auth & rate limiting

- Both endpoints stay gated behind `ctx.internal` (env-secret `REI_AGENT_API_KEYS`). Paid `rei_live_…` keys keep getting `404 Not found` on these routes — public marketplace keys must not enumerate users.
- Existing per-key minute bucket already applies.

## Docs

Update `docs/agent-integration.md`:
- Expand the `/registered` field list.
- Add a `/match` section with the same shape as other endpoints (params, sample response, internal-only note).

## Technical notes

- Files touched: `supabase/functions/public-feed/index.ts`, `docs/agent-integration.md`.
- No DB migration needed — all source columns already exist on `rei_registry` and `skill_categories`.
- Matching query: pull user's `skill_category_ids` + `role_tags`, then
  `tasks/jobs` where `status='active'` and `skill_category_ids && user.skill_category_ids` OR `role_tags && user.role_tags`, ordered by `created_at desc`, limited.
- `top_categories` resolved with a single `skill_categories.select('id,name').in('id', user.skill_category_ids)` call.
- No changes to RLS — function uses service role and hand-picks columns, same pattern as the rest of `public-feed`.
