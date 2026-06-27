
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS compensation_amount_usd numeric,
  ADD COLUMN IF NOT EXISTS compensation_priced_at timestamptz,
  ADD COLUMN IF NOT EXISTS compensation_price_source text;

CREATE TABLE IF NOT EXISTS public.platform_stats (
  id text PRIMARY KEY,
  total_bounties integer NOT NULL DEFAULT 0,
  total_value_usd numeric NOT NULL DEFAULT 0,
  priced_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_stats TO anon, authenticated;
GRANT ALL ON public.platform_stats TO service_role;

ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_stats public read" ON public.platform_stats;
CREATE POLICY "platform_stats public read" ON public.platform_stats FOR SELECT USING (true);

INSERT INTO public.platform_stats (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;
