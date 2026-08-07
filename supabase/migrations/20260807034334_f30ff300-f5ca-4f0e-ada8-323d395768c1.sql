-- Operational event log for webhooks and scheduled jobs
CREATE TABLE public.ops_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('webhook','job')),
  source text NOT NULL,
  status text NOT NULL CHECK (status IN ('success','failure','warning')),
  message text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ops_events_created_at ON public.ops_events (created_at DESC);
CREATE INDEX idx_ops_events_source_created ON public.ops_events (source, created_at DESC);
CREATE INDEX idx_ops_events_status ON public.ops_events (status, created_at DESC);

GRANT SELECT ON public.ops_events TO authenticated;
GRANT ALL ON public.ops_events TO service_role;

ALTER TABLE public.ops_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ops events"
  ON public.ops_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages ops events"
  ON public.ops_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Expected monitoring windows per monitored source (hours without a success = alert)
CREATE TABLE public.ops_monitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('webhook','job')),
  source text NOT NULL UNIQUE,
  label text NOT NULL,
  max_silence_hours integer NOT NULL DEFAULT 26,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ops_monitors TO authenticated;
GRANT ALL ON public.ops_monitors TO service_role;
ALTER TABLE public.ops_monitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ops monitors"
  ON public.ops_monitors FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages ops monitors"
  ON public.ops_monitors FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_ops_monitors_updated
  BEFORE UPDATE ON public.ops_monitors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ops_monitors (kind, source, label, max_silence_hours) VALUES
  ('webhook', 'payments-webhook', 'Stripe payments webhook', 720),
  ('job', 'sync-drive-tasks', 'Daily bounty sync', 26),
  ('job', 'price-bounties', 'Daily bounty pricing', 26),
  ('job', 'sample-nlo-yield', 'Daily NLO yield sample', 26),
  ('job', 'refresh-active-campaigns', 'Campaign refresh (every 2 days)', 50);

-- Record an operational event (called from edge functions / server routes)
CREATE OR REPLACE FUNCTION public.log_ops_event(
  p_kind text, p_source text, p_status text,
  p_message text DEFAULT NULL, p_detail jsonb DEFAULT '{}'::jsonb,
  p_duration_ms integer DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  INSERT INTO public.ops_events (kind, source, status, message, detail, duration_ms)
  VALUES (p_kind, p_source, p_status, p_message, COALESCE(p_detail,'{}'::jsonb), p_duration_ms)
  RETURNING id INTO new_id;
  RETURN new_id;
END; $$;

REVOKE ALL ON FUNCTION public.log_ops_event(text,text,text,text,jsonb,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_ops_event(text,text,text,text,jsonb,integer) TO service_role;

-- Health rollup: per-monitor last success/failure plus stale + failing verdicts
CREATE OR REPLACE FUNCTION public.ops_health()
RETURNS TABLE(
  kind text, source text, label text, max_silence_hours integer,
  last_success_at timestamptz, last_failure_at timestamptz,
  failures_24h bigint, successes_24h bigint, hours_since_success numeric, state text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH agg AS (
    SELECT m.kind, m.source, m.label, m.max_silence_hours,
      (SELECT max(created_at) FROM public.ops_events e WHERE e.source = m.source AND e.status = 'success') AS last_success_at,
      (SELECT max(created_at) FROM public.ops_events e WHERE e.source = m.source AND e.status = 'failure') AS last_failure_at,
      (SELECT count(*) FROM public.ops_events e WHERE e.source = m.source AND e.status = 'failure' AND e.created_at > now() - interval '24 hours') AS failures_24h,
      (SELECT count(*) FROM public.ops_events e WHERE e.source = m.source AND e.status = 'success' AND e.created_at > now() - interval '24 hours') AS successes_24h
    FROM public.ops_monitors m WHERE m.enabled
  )
  SELECT kind, source, label, max_silence_hours, last_success_at, last_failure_at,
    failures_24h, successes_24h,
    round(EXTRACT(epoch FROM (now() - last_success_at)) / 3600.0, 1) AS hours_since_success,
    CASE
      WHEN last_success_at IS NULL THEN 'unknown'
      WHEN EXTRACT(epoch FROM (now() - last_success_at)) / 3600.0 > max_silence_hours THEN 'stale'
      WHEN failures_24h > 0 THEN 'failing'
      ELSE 'healthy'
    END AS state
  FROM agg ORDER BY kind, source;
$$;

GRANT EXECUTE ON FUNCTION public.ops_health() TO authenticated, service_role;

-- Scheduled-job runner health straight from pg_cron history
CREATE OR REPLACE FUNCTION public.ops_cron_health()
RETURNS TABLE(jobname text, schedule text, active boolean, last_run timestamptz, last_status text, failures_7d bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, cron AS $$
  SELECT j.jobname::text, j.schedule::text, j.active,
    (SELECT max(d.start_time) FROM cron.job_run_details d WHERE d.jobid = j.jobid),
    (SELECT d.status::text FROM cron.job_run_details d WHERE d.jobid = j.jobid ORDER BY d.start_time DESC LIMIT 1),
    (SELECT count(*) FROM cron.job_run_details d WHERE d.jobid = j.jobid AND d.status <> 'succeeded' AND d.start_time > now() - interval '7 days')
  FROM cron.job j ORDER BY j.jobname;
$$;

GRANT EXECUTE ON FUNCTION public.ops_cron_health() TO authenticated, service_role;