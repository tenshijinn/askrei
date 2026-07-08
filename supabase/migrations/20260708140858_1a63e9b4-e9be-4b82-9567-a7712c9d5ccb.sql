
-- 1. Remove public SELECT on campaign_clicks
DROP POLICY IF EXISTS "Promotion clicks are publicly readable" ON public.campaign_clicks;

-- 2. Aggregate helper: public unique visit count by short_code
CREATE OR REPLACE FUNCTION public.get_campaign_unique_visits(p_short_code text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(count(*), 0)::int
  FROM public.campaign_clicks
  WHERE short_code = p_short_code AND is_unique = true;
$$;
GRANT EXECUTE ON FUNCTION public.get_campaign_unique_visits(text) TO anon, authenticated;

-- 3. Aggregate helper: per-day stats for a set of campaign ids (owner dashboard)
CREATE OR REPLACE FUNCTION public.get_campaign_click_stats(p_campaign_ids uuid[])
RETURNS TABLE(campaign_subscription_id uuid, click_date date, total_clicks bigint, unique_clicks bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT campaign_subscription_id, click_date,
         count(*)::bigint AS total_clicks,
         count(*) FILTER (WHERE is_unique)::bigint AS unique_clicks
  FROM public.campaign_clicks
  WHERE campaign_subscription_id = ANY(p_campaign_ids)
  GROUP BY campaign_subscription_id, click_date;
$$;
GRANT EXECUTE ON FUNCTION public.get_campaign_click_stats(uuid[]) TO anon, authenticated;

-- 4. Drop always-true INSERT policies (writes happen via edge functions with service role)
DROP POLICY IF EXISTS "Anyone can insert comm submissions" ON public.community_submissions;
DROP POLICY IF EXISTS "Anyone can insert payment references" ON public.payment_references;
DROP POLICY IF EXISTS "Anyone can submit whitelist requests" ON public.twitter_whitelist_submissions;

-- 5. Restrictive policies on storage.objects for the rei-contributor-files bucket
-- Blocks all anon/authenticated direct access; service_role bypasses RLS so edge functions still work.
DROP POLICY IF EXISTS "rei-contributor-files block client select" ON storage.objects;
DROP POLICY IF EXISTS "rei-contributor-files block client insert" ON storage.objects;
DROP POLICY IF EXISTS "rei-contributor-files block client update" ON storage.objects;
DROP POLICY IF EXISTS "rei-contributor-files block client delete" ON storage.objects;

CREATE POLICY "rei-contributor-files block client select"
ON storage.objects AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (bucket_id <> 'rei-contributor-files');

CREATE POLICY "rei-contributor-files block client insert"
ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id <> 'rei-contributor-files');

CREATE POLICY "rei-contributor-files block client update"
ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated
USING (bucket_id <> 'rei-contributor-files')
WITH CHECK (bucket_id <> 'rei-contributor-files');

CREATE POLICY "rei-contributor-files block client delete"
ON storage.objects AS RESTRICTIVE FOR DELETE TO anon, authenticated
USING (bucket_id <> 'rei-contributor-files');
