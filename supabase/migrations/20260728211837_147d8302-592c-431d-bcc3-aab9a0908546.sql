
ALTER TABLE public.campaign_clicks ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false;
ALTER TABLE public.campaign_impressions ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false;

DROP FUNCTION IF EXISTS public.get_campaign_click_stats(uuid[]);
DROP FUNCTION IF EXISTS public.get_campaign_impression_stats(uuid[]);

CREATE OR REPLACE FUNCTION public.get_campaign_click_stats(p_campaign_ids uuid[])
 RETURNS TABLE(campaign_subscription_id uuid, click_date date, total_clicks bigint, unique_clicks bigint, guest_clicks bigint, guest_unique_clicks bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT campaign_subscription_id, click_date,
         count(*)::bigint,
         count(*) FILTER (WHERE is_unique)::bigint,
         count(*) FILTER (WHERE is_guest)::bigint,
         count(*) FILTER (WHERE is_guest AND is_unique)::bigint
  FROM public.campaign_clicks
  WHERE campaign_subscription_id = ANY(p_campaign_ids)
  GROUP BY campaign_subscription_id, click_date;
$function$;

CREATE OR REPLACE FUNCTION public.get_campaign_impression_stats(p_campaign_ids uuid[])
 RETURNS TABLE(campaign_subscription_id uuid, impression_date date, total_impressions bigint, unique_impressions bigint, guest_impressions bigint, guest_unique_impressions bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT campaign_subscription_id, impression_date,
         count(*)::bigint,
         count(*) FILTER (WHERE is_unique)::bigint,
         count(*) FILTER (WHERE is_guest)::bigint,
         count(*) FILTER (WHERE is_guest AND is_unique)::bigint
  FROM public.campaign_impressions
  WHERE campaign_subscription_id = ANY(p_campaign_ids)
  GROUP BY campaign_subscription_id, impression_date;
$function$;
