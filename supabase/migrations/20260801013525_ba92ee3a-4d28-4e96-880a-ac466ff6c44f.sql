CREATE TABLE IF NOT EXISTS public.earn_market_cache (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.earn_market_cache TO service_role;
ALTER TABLE public.earn_market_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "earn_market_cache no public access" ON public.earn_market_cache FOR SELECT TO authenticated USING (false);