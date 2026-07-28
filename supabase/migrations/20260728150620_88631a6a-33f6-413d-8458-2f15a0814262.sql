
CREATE TABLE public.ask_public_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  last_asked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ask_count INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ask_public_usage_ip_hash_idx ON public.ask_public_usage(ip_hash);
GRANT ALL ON public.ask_public_usage TO service_role;
ALTER TABLE public.ask_public_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no_public_access" ON public.ask_public_usage FOR ALL USING (false) WITH CHECK (false);
