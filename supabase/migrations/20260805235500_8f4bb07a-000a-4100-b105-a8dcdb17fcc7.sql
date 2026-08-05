-- Revert to security_invoker view (avoids definer-view escalation)
ALTER VIEW public.v_public_campaign_subscriptions SET (security_invoker = true);

-- Column-level grants: no access to customer_email / stripe_subscription_id / last_error
REVOKE SELECT ON public.campaign_subscriptions FROM anon, authenticated;
GRANT SELECT (
  id, project_name, project_link, short_code, status, source, screenshot_url,
  tasks_imported_count, scrape_count, last_scraped_at, expires_at,
  created_at, updated_at, x_user_id, wallet_address
) ON public.campaign_subscriptions TO anon, authenticated;

-- Row-level: only active/pending campaigns visible publicly
CREATE POLICY "Public can view active campaign feed rows"
ON public.campaign_subscriptions
FOR SELECT
TO anon, authenticated
USING (status = ANY (ARRAY['active'::text, 'pending'::text]));