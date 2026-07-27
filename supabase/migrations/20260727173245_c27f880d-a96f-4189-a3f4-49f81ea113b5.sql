ALTER VIEW public.v_public_campaign_subscriptions SET (security_invoker = true);

REVOKE SELECT ON public.campaign_subscriptions FROM anon, authenticated;
GRANT SELECT (
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
) ON public.campaign_subscriptions TO anon, authenticated;

DROP POLICY IF EXISTS "Public can view active campaign subscription feed fields" ON public.campaign_subscriptions;
CREATE POLICY "Public can view active campaign subscription feed fields"
ON public.campaign_subscriptions
FOR SELECT
TO anon, authenticated
USING (status = ANY (ARRAY['active'::text, 'pending'::text]));

GRANT SELECT ON public.v_public_campaign_subscriptions TO anon, authenticated;
GRANT SELECT ON public.v_public_campaign_subscriptions TO service_role;