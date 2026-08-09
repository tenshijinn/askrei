GRANT SELECT ON public.campaign_subscriptions TO anon, authenticated;
GRANT INSERT, UPDATE ON public.campaign_subscriptions TO authenticated;
GRANT ALL ON public.campaign_subscriptions TO service_role;

GRANT SELECT ON public.v_public_campaign_subscriptions TO anon, authenticated;
GRANT ALL ON public.v_public_campaign_subscriptions TO service_role;

GRANT SELECT, INSERT ON public.campaign_clicks TO anon, authenticated;
GRANT ALL ON public.campaign_clicks TO service_role;

GRANT SELECT, INSERT ON public.campaign_impressions TO anon, authenticated;
GRANT ALL ON public.campaign_impressions TO service_role;