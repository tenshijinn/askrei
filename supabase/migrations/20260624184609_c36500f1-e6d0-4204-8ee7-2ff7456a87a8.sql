
-- 1. campaign_subscriptions: drop blanket public SELECT, expose safe cols via view
DROP POLICY IF EXISTS "Promotions are publicly readable" ON public.campaign_subscriptions;

CREATE OR REPLACE VIEW public.v_public_campaign_subscriptions
WITH (security_invoker = on) AS
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
  updated_at
FROM public.campaign_subscriptions
WHERE status IN ('active','pending');

GRANT SELECT ON public.v_public_campaign_subscriptions TO anon, authenticated;

-- Allow authenticated users to read their own subscription row (for post-checkout return page)
-- via stripe_subscription_id lookup, but we keep email/sub_id off the public view and
-- rely on service-role / admin for sensitive reads. The client now uses the view.

-- 2. v_public_tasks: recreate with security_invoker
DO $$
DECLARE def text;
BEGIN
  SELECT pg_get_viewdef('public.v_public_tasks'::regclass, true) INTO def;
  IF def IS NOT NULL THEN
    EXECUTE 'DROP VIEW public.v_public_tasks';
    EXECUTE 'CREATE VIEW public.v_public_tasks WITH (security_invoker = on) AS ' || def;
    EXECUTE 'GRANT SELECT ON public.v_public_tasks TO anon, authenticated';
  END IF;
END $$;

-- 3. jobs INSERT: require employer_wallet to match the caller's wallet claim
DROP POLICY IF EXISTS "Employers can insert their own jobs" ON public.jobs;
CREATE POLICY "Employers can insert their own jobs"
ON public.jobs
FOR INSERT
WITH CHECK (
  employer_wallet = ((current_setting('request.jwt.claims', true))::json ->> 'wallet_address')
);

-- 4. tasks INSERT: same ownership check
DROP POLICY IF EXISTS "Employers can insert their own tasks" ON public.tasks;
CREATE POLICY "Employers can insert their own tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  employer_wallet = ((current_setting('request.jwt.claims', true))::json ->> 'wallet_address')
);
