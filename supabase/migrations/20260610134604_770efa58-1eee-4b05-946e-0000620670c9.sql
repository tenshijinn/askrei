
ALTER TABLE public.campaign_subscriptions ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tracking_short_code text;

CREATE INDEX IF NOT EXISTS tasks_tracking_short_code_idx ON public.tasks(tracking_short_code);
CREATE INDEX IF NOT EXISTS campaign_subscriptions_source_idx ON public.campaign_subscriptions(source);
CREATE INDEX IF NOT EXISTS campaign_subscriptions_x_user_id_idx ON public.campaign_subscriptions(x_user_id);
CREATE INDEX IF NOT EXISTS campaign_subscriptions_wallet_address_idx ON public.campaign_subscriptions(wallet_address);

DROP POLICY IF EXISTS "Users can view their own promotions" ON public.campaign_subscriptions;
CREATE POLICY "Promotions are publicly readable"
  ON public.campaign_subscriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can view clicks for their promotions" ON public.campaign_clicks;
CREATE POLICY "Promotion clicks are publicly readable"
  ON public.campaign_clicks FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.generate_campaign_short_code()
RETURNS text LANGUAGE plpgsql VOLATILE SET search_path = public AS $$
DECLARE code text; tries int := 0;
BEGIN
  LOOP
    code := substring(md5(random()::text || clock_timestamp()::text), 1, 8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.campaign_subscriptions WHERE short_code = code);
    tries := tries + 1;
    IF tries > 10 THEN
      code := substring(md5(random()::text || clock_timestamp()::text || tries::text), 1, 12);
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END; $$;

CREATE OR REPLACE FUNCTION public.attach_aggregated_task_to_wayne()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  wayne_x text := '1288555819248877568';
  wayne_wallet text := '2gvgWcEiqNB3ikkNx8PgXSSaDHJRE3F6qs25Q5xzHrBt';
  sub_id uuid; sub_code text;
BEGIN
  IF NEW.source IS NULL OR NEW.source IN ('user','manual') THEN
    RETURN NEW;
  END IF;
  SELECT id, short_code INTO sub_id, sub_code
  FROM public.campaign_subscriptions
  WHERE x_user_id = wayne_x AND project_link = NEW.link LIMIT 1;
  IF sub_id IS NULL THEN
    sub_code := public.generate_campaign_short_code();
    INSERT INTO public.campaign_subscriptions (
      stripe_subscription_id, customer_email, project_name, project_link,
      status, x_user_id, wallet_address, short_code, source
    ) VALUES (
      'aggregated:' || gen_random_uuid()::text,
      'aggregator@rei.chat',
      COALESCE(NEW.title, 'Aggregated bounty'),
      NEW.link, 'active', wayne_x, wayne_wallet, sub_code,
      'aggregated:' || NEW.source
    ) RETURNING id, short_code INTO sub_id, sub_code;
  END IF;
  NEW.campaign_subscription_id := sub_id;
  NEW.tracking_short_code := sub_code;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_attach_aggregated_task_to_wayne ON public.tasks;
CREATE TRIGGER trg_attach_aggregated_task_to_wayne
  BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.attach_aggregated_task_to_wayne();

DO $$
DECLARE
  wayne_x text := '1288555819248877568';
  wayne_wallet text := '2gvgWcEiqNB3ikkNx8PgXSSaDHJRE3F6qs25Q5xzHrBt';
  t record; sub_id uuid; sub_code text;
BEGIN
  FOR t IN
    SELECT id, title, link, source FROM public.tasks
    WHERE source IS NOT NULL AND source NOT IN ('user','manual')
      AND campaign_subscription_id IS NULL
  LOOP
    SELECT id, short_code INTO sub_id, sub_code
    FROM public.campaign_subscriptions
    WHERE x_user_id = wayne_x AND project_link = t.link LIMIT 1;
    IF sub_id IS NULL THEN
      sub_code := public.generate_campaign_short_code();
      INSERT INTO public.campaign_subscriptions (
        stripe_subscription_id, customer_email, project_name, project_link,
        status, x_user_id, wallet_address, short_code, source
      ) VALUES (
        'aggregated:' || gen_random_uuid()::text,
        'aggregator@rei.chat',
        COALESCE(t.title, 'Aggregated bounty'),
        t.link, 'active', wayne_x, wayne_wallet, sub_code,
        'aggregated:' || t.source
      ) RETURNING id, short_code INTO sub_id, sub_code;
    END IF;
    UPDATE public.tasks SET campaign_subscription_id = sub_id,
      tracking_short_code = sub_code WHERE id = t.id;
  END LOOP;
END; $$;

CREATE OR REPLACE VIEW public.v_public_tasks AS
SELECT id, title, description, link, role_tags, compensation, og_image,
       source, company_name, end_date, opportunity_type, skill_category_ids,
       created_at, updated_at, tracking_short_code
FROM public.tasks
WHERE status = 'active' AND (end_date IS NULL OR end_date > now());

GRANT SELECT ON public.v_public_tasks TO anon, authenticated, service_role;
