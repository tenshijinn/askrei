GRANT SELECT ON TABLE public.campaign_subscriptions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.campaign_subscriptions TO service_role;
GRANT SELECT ON TABLE public.v_public_campaign_subscriptions TO anon, authenticated, service_role;