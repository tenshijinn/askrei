
ALTER TABLE public.platform_stats
  ADD COLUMN IF NOT EXISTS lifetime_bounties INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_value_usd NUMERIC NOT NULL DEFAULT 0;

UPDATE public.platform_stats
SET lifetime_bounties = GREATEST(lifetime_bounties, COALESCE(total_bounties, 0)),
    lifetime_value_usd = GREATEST(lifetime_value_usd, COALESCE(total_value_usd, 0));
