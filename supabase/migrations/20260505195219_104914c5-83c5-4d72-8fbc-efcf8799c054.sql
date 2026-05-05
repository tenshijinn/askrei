CREATE TABLE IF NOT EXISTS public.x_follow_checks (
  x_user_id text PRIMARY KEY,
  follows_askrei boolean NOT NULL DEFAULT false,
  checked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.x_follow_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages follow checks"
ON public.x_follow_checks FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');