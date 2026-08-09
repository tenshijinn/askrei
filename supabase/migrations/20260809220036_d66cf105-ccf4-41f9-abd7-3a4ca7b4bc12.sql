ALTER TABLE public.campaign_clicks
  ADD COLUMN IF NOT EXISTS viewer_x_user_id text,
  ADD COLUMN IF NOT EXISTS viewer_wallet_address text;

ALTER TABLE public.campaign_impressions
  ADD COLUMN IF NOT EXISTS viewer_x_user_id text,
  ADD COLUMN IF NOT EXISTS viewer_wallet_address text;

CREATE INDEX IF NOT EXISTS idx_campaign_clicks_campaign_viewer
  ON public.campaign_clicks (campaign_subscription_id, viewer_x_user_id);

CREATE INDEX IF NOT EXISTS idx_campaign_impressions_campaign_viewer
  ON public.campaign_impressions (campaign_subscription_id, viewer_x_user_id);