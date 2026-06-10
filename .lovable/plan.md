## 1. Redirect loading screen

Update `src/pages/CampaignRedirect.tsx`:
- Replace text with `> redirecting to bounty...`
- Remove the secondary "Recording click…" line
- Add a terminal-style animated loading bar beneath the heading (ASCII block characters filling left-to-right via a CSS keyframe, e.g. `[████░░░░░░]` cycling, monospace, accent color `#ed565a`)
- Error state unchanged

## 2. "# Visits" on bounty cards

Goal: show unique-click count next to the "Open" link on each bounty card (the `TaskPreviewCard`), formatted as `12 Visits  |  Open ↗`.

### Data
- `tasks.tracking_short_code` → `campaign_subscriptions.short_code` → `campaign_clicks` rows
- Unique visits = `COUNT(DISTINCT ip_hash)` for that subscription

### Implementation
- Extend `useTaskPreview` hook to also return `unique_visits` (number | null). When the task has a `tracking_short_code` + `campaign_subscription_id`, run a second lightweight query against `campaign_clicks` filtered by that subscription id and compute the distinct `ip_hash` count client-side (small volume; existing RLS already allows SELECT).
- In `src/components/chat/TaskPreviewCard.tsx`, in the bottom-right row replace the lone "Open" with:
  - `{visits} Visits` (only when `unique_visits > 0`)
  - a thin separator `|` in muted cream
  - existing `Open ↗`
- Style matches screenshot: 11px, `hsla(18,52%,82%,0.7)`, separator at 0.3 opacity.

### Out of scope
- No backend/RLS/schema changes (data + grants already in place from previous migration).
- No changes to BountyPromotions analytics page.
