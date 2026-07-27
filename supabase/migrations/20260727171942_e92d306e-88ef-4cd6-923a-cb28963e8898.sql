DROP VIEW IF EXISTS public.v_public_campaign_subscriptions;

CREATE VIEW public.v_public_campaign_subscriptions
WITH (security_invoker=on) AS
SELECT
  id,
  project_name,
  project_link,
  short_code,
  status,
  source,
  screenshot_url,
  tasks_imported_count,
  scrape_count,
  last_scraped_at,
  expires_at,
  created_at,
  updated_at,
  x_user_id,
  wallet_address
FROM public.campaign_subscriptions
WHERE status = ANY (ARRAY['active'::text, 'pending'::text]);

GRANT SELECT ON public.v_public_campaign_subscriptions TO anon, authenticated;
