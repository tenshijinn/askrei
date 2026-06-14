CREATE OR REPLACE VIEW public.v_public_tasks AS
SELECT id, title, description, link, role_tags, compensation, og_image, source,
       company_name, end_date, opportunity_type, skill_category_ids,
       created_at, updated_at, tracking_short_code
FROM public.tasks
WHERE status = 'active'
  AND (end_date IS NULL OR end_date > now())
  AND created_at > now() - interval '30 days';