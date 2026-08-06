CREATE TABLE public.earn_shares (
  id text PRIMARY KEY,
  state jsonb NOT NULL,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.earn_shares TO service_role;

ALTER TABLE public.earn_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "earn_shares admin read" ON public.earn_shares
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));