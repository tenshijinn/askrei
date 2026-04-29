-- Public-safe views for the Rei agent (OpenClaw) feed.
-- Security-invoker so the views inherit caller RLS (which already permits anyone to SELECT active tasks/jobs).
-- Whitelist columns explicitly: NO employer_wallet, NO payment_tx_signature, NO solana_pay_reference, NO external_id.

CREATE OR REPLACE VIEW public.v_public_tasks
WITH (security_invoker = on) AS
SELECT
  id,
  title,
  description,
  link,
  role_tags,
  compensation,
  og_image,
  source,
  company_name,
  end_date,
  opportunity_type,
  skill_category_ids,
  created_at,
  updated_at
FROM public.tasks
WHERE status = 'active'
  AND (end_date IS NULL OR end_date > now());

CREATE OR REPLACE VIEW public.v_public_jobs
WITH (security_invoker = on) AS
SELECT
  id,
  title,
  description,
  requirements,
  link,
  apply_url,
  role_tags,
  compensation,
  og_image,
  source,
  company_name,
  deadline,
  expires_at,
  opportunity_type,
  skill_category_ids,
  created_at,
  updated_at
FROM public.jobs
WHERE status = 'active'
  AND (expires_at IS NULL OR expires_at > now());

GRANT SELECT ON public.v_public_tasks TO anon, authenticated;
GRANT SELECT ON public.v_public_jobs TO anon, authenticated;