# Scope participants to each campaign's engagers

The current "Rei User Participants" section lists every registry member to everyone. That's wrong. It should instead show, per campaign, the Rei members who actually engaged with that publisher's campaign (impression and/or click) — visible only to the publisher of that campaign.

## What blocks this today (verified)

`campaign_clicks` and `campaign_impressions` store only anonymised signals — `ip_hash`, `user_agent_hash`, `session_id`, `is_guest` — and no viewer identity. The tracking calls (`useImpressionTracker`, `CampaignRedirect`) send only `shortCode` and a `guest` flag. So there is currently **no data** linking an engagement to a Rei member: existing historical rows can never be attributed. Identity capture has to start now, and the participants list will fill in from this point forward.

## What we build

1. **Capture viewer identity on engagement (going forward)**
   - Add a nullable viewer identity to both engagement tables (`viewer_x_user_id`, `viewer_wallet_address`).
   - The impression hook and the click redirect pass the signed-in member's X id / wallet when a session exists; guests keep sending nothing (still counted as guest, still anonymous).
   - Both edge functions validate and store it, and never store it for guests.

2. **Per-campaign participants, publisher-only**
   - Replace the global `rei-participants` function with `campaign-participants`: takes a campaign id (or short code), verifies the caller owns that campaign (matching `x_user_id` / `wallet_address` on `campaign_subscriptions`), and returns the distinct members who engaged with it, plus per-member `impressions` / `clicks` counts and `first_seen` / `last_seen`.
   - Each member is enriched from `rei_registry` with display-safe fields only: handle, display name, avatar, SOL/EVM wallet, diamond score/tier, community, confidence, trust (`100 − risk`). No emails, file paths, or raw analysis.
   - A non-owner requesting a campaign gets nothing.

3. **UI: participants live inside each campaign row**
   - Remove the standalone global section from the account page.
   - Under each campaign's Impressions/Clicks panel in `BountyPromotions`, add a collapsible "Participants (N)" block: search, sort (Diamond Score / Community / Confidence / Trust), CSV export, and the existing participant cards — now with the engagement counts for that campaign.
   - Empty state explains that only signed-in Rei members who engaged after identity tracking went live appear here, and that guest traffic stays anonymous in the totals.

## Technical notes

- Migration: two nullable columns plus indexes on `(campaign_subscription_id, viewer_x_user_id)` for both engagement tables. No RLS change needed — the new function reads with the service role and does its own ownership check.
- `ReiParticipants.tsx` becomes `CampaignParticipants.tsx` (takes `campaignId`, fetches on first expand); `ParticipantCard.tsx` is reused with optional impressions/clicks chips.
- `src/pages/Rei.tsx` drops `<ReiParticipants />`; the old `rei-participants` function is deleted.
- Guest counts in the dashboard stay exactly as they are — this only adds attribution for signed-in members.
