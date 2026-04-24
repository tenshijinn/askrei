-- 1. subscriptions table (Stripe lifecycle)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','live')),
  user_id UUID,
  customer_email TEXT,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  price_id TEXT,
  product_id TEXT,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_customer ON public.subscriptions(stripe_customer_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Admins view subscriptions" ON public.subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. campaign_subscriptions table (Unlimited Posts campaign metadata)
CREATE TABLE public.campaign_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  customer_email TEXT NOT NULL,
  project_name TEXT NOT NULL,
  project_link TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  last_scraped_at TIMESTAMPTZ,
  scrape_count INTEGER DEFAULT 0,
  tasks_imported_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaign_subs_status_expires ON public.campaign_subscriptions(status, expires_at);

ALTER TABLE public.campaign_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages campaign subscriptions" ON public.campaign_subscriptions
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Admins view campaign subscriptions" ON public.campaign_subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_campaign_subs_updated
  BEFORE UPDATE ON public.campaign_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. link tasks back to their campaign subscription
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS campaign_subscription_id UUID REFERENCES public.campaign_subscriptions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_sub ON public.tasks(campaign_subscription_id);