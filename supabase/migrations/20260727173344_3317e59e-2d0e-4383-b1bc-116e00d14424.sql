DROP POLICY IF EXISTS "Admins view campaign subscriptions" ON public.campaign_subscriptions;

CREATE POLICY "Admins view campaign subscriptions"
ON public.campaign_subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));