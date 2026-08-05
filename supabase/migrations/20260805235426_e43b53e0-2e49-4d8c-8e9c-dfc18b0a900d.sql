-- 1. Campaign subscriptions: stop exposing raw table (PII) to anon/authenticated
DROP POLICY IF EXISTS "Public can view active campaign subscription feed fields" ON public.campaign_subscriptions;
ALTER VIEW public.v_public_campaign_subscriptions SET (security_invoker = false);
REVOKE SELECT ON public.campaign_subscriptions FROM anon;
GRANT SELECT ON public.v_public_campaign_subscriptions TO anon, authenticated;

-- 2. Campaign impressions: fix broken ownership check
DROP POLICY IF EXISTS "Owners can view own campaign impressions" ON public.campaign_impressions;
CREATE POLICY "Admins can view all campaign impressions"
ON public.campaign_impressions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Treasury wallet: admins only
DROP POLICY IF EXISTS "Anyone can view treasury" ON public.rei_treasury_wallet;

-- 4. SECURITY DEFINER functions no longer directly callable by anon/authenticated
REVOKE ALL ON FUNCTION public.get_campaign_click_stats(uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_campaign_impression_stats(uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_campaign_unique_visits(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_campaign_click_stats(uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_campaign_impression_stats(uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_campaign_unique_visits(text) TO service_role;