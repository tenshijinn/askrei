
CREATE TABLE public.campaign_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_subscription_id uuid NOT NULL REFERENCES public.campaign_subscriptions(id) ON DELETE CASCADE,
  short_code text NOT NULL,
  ip_hash text,
  user_agent_hash text,
  session_id uuid,
  impression_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  is_unique boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_impressions_sub ON public.campaign_impressions(campaign_subscription_id);
CREATE INDEX idx_campaign_impressions_code ON public.campaign_impressions(short_code);
CREATE INDEX idx_campaign_impressions_iphash_date ON public.campaign_impressions(ip_hash, short_code, impression_date);

GRANT SELECT ON public.campaign_impressions TO authenticated;
GRANT ALL ON public.campaign_impressions TO service_role;

ALTER TABLE public.campaign_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own campaign impressions"
ON public.campaign_impressions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_subscriptions cs
    WHERE cs.id = campaign_impressions.campaign_subscription_id
      AND (cs.wallet_address IS NOT NULL OR cs.x_user_id IS NOT NULL)
  )
);

CREATE OR REPLACE FUNCTION public.get_campaign_impression_stats(p_campaign_ids uuid[])
RETURNS TABLE(campaign_subscription_id uuid, impression_date date, total_impressions bigint, unique_impressions bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT campaign_subscription_id, impression_date,
         count(*)::bigint AS total_impressions,
         count(*) FILTER (WHERE is_unique)::bigint AS unique_impressions
  FROM public.campaign_impressions
  WHERE campaign_subscription_id = ANY(p_campaign_ids)
  GROUP BY campaign_subscription_id, impression_date;
$$;
