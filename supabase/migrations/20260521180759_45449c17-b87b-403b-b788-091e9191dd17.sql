CREATE TABLE public.zernio_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'zernio',
  event_type TEXT,
  external_id TEXT,
  x_user_id TEXT,
  x_handle TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zernio_webhook_events_received_at ON public.zernio_webhook_events (received_at DESC);
CREATE INDEX idx_zernio_webhook_events_external_id ON public.zernio_webhook_events (external_id);
CREATE INDEX idx_zernio_webhook_events_x_user_id ON public.zernio_webhook_events (x_user_id);
CREATE INDEX idx_zernio_webhook_events_processed ON public.zernio_webhook_events (processed) WHERE processed = false;

ALTER TABLE public.zernio_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages zernio webhook events"
ON public.zernio_webhook_events
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Admins can view zernio webhook events"
ON public.zernio_webhook_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));