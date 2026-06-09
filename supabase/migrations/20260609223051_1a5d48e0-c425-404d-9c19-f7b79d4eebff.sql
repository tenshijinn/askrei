
-- 1. Extend campaign_subscriptions with user identity + short_code
ALTER TABLE public.campaign_subscriptions
  ADD COLUMN IF NOT EXISTS x_user_id text,
  ADD COLUMN IF NOT EXISTS wallet_address text,
  ADD COLUMN IF NOT EXISTS short_code text;

CREATE UNIQUE INDEX IF NOT EXISTS campaign_subscriptions_short_code_key
  ON public.campaign_subscriptions(short_code) WHERE short_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS campaign_subscriptions_x_user_id_idx
  ON public.campaign_subscriptions(x_user_id);
CREATE INDEX IF NOT EXISTS campaign_subscriptions_wallet_idx
  ON public.campaign_subscriptions(wallet_address);

-- Owner read policy via JWT claims (mirrors referral_codes pattern)
DROP POLICY IF EXISTS "Users can view their own promotions" ON public.campaign_subscriptions;
CREATE POLICY "Users can view their own promotions"
  ON public.campaign_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    (x_user_id IS NOT NULL AND x_user_id = ((current_setting('request.jwt.claims', true))::json ->> 'x_user_id'))
    OR (wallet_address IS NOT NULL AND wallet_address = ((current_setting('request.jwt.claims', true))::json ->> 'wallet_address'))
  );

-- 2. Create campaign_clicks
CREATE TABLE IF NOT EXISTS public.campaign_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_subscription_id uuid NOT NULL REFERENCES public.campaign_subscriptions(id) ON DELETE CASCADE,
  short_code text NOT NULL,
  ip_hash text,
  user_agent_hash text,
  referrer text,
  session_id uuid,
  click_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  is_unique boolean NOT NULL DEFAULT false,
  points_awarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.campaign_clicks TO authenticated;
GRANT ALL ON public.campaign_clicks TO service_role;

CREATE INDEX IF NOT EXISTS campaign_clicks_campaign_id_date_idx
  ON public.campaign_clicks(campaign_subscription_id, click_date);
CREATE INDEX IF NOT EXISTS campaign_clicks_short_code_idx
  ON public.campaign_clicks(short_code);
CREATE INDEX IF NOT EXISTS campaign_clicks_ip_campaign_idx
  ON public.campaign_clicks(ip_hash, campaign_subscription_id);
CREATE UNIQUE INDEX IF NOT EXISTS campaign_clicks_dedupe_idx
  ON public.campaign_clicks(short_code, ip_hash, click_date) WHERE ip_hash IS NOT NULL;

ALTER TABLE public.campaign_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages campaign clicks"
  ON public.campaign_clicks FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Owners can view clicks for their promotions"
  ON public.campaign_clicks FOR SELECT
  TO authenticated
  USING (
    campaign_subscription_id IN (
      SELECT id FROM public.campaign_subscriptions cs
      WHERE (cs.x_user_id IS NOT NULL AND cs.x_user_id = ((current_setting('request.jwt.claims', true))::json ->> 'x_user_id'))
         OR (cs.wallet_address IS NOT NULL AND cs.wallet_address = ((current_setting('request.jwt.claims', true))::json ->> 'wallet_address'))
    )
  );

CREATE POLICY "Admins can view all campaign clicks"
  ON public.campaign_clicks FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
