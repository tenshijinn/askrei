ALTER TABLE public.rei_registry
  ADD COLUMN IF NOT EXISTS diamond_score integer,
  ADD COLUMN IF NOT EXISTS diamond_tier text,
  ADD COLUMN IF NOT EXISTS wallet_behaviour jsonb;