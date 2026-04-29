-- Agent API keys
CREATE TABLE public.agent_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  label text,
  buyer_wallet text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('payg','starter','pro')),
  rate_limit_per_min int NOT NULL DEFAULT 60,
  expires_at timestamptz,
  payment_tx_signature text NOT NULL,
  payment_reference text,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX idx_agent_api_keys_hash ON public.agent_api_keys(key_hash);
CREATE INDEX idx_agent_api_keys_buyer ON public.agent_api_keys(buyer_wallet);

ALTER TABLE public.agent_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers view own agent keys"
  ON public.agent_api_keys FOR SELECT
  USING (buyer_wallet = ((current_setting('request.jwt.claims', true))::json ->> 'wallet_address'));

CREATE POLICY "Service role manages agent keys"
  ON public.agent_api_keys FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Usage log
CREATE TABLE public.agent_api_usage (
  id bigserial PRIMARY KEY,
  api_key_id uuid REFERENCES public.agent_api_keys(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  status int NOT NULL,
  ts timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_api_usage_key_ts ON public.agent_api_usage(api_key_id, ts DESC);

ALTER TABLE public.agent_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers view own usage"
  ON public.agent_api_usage FOR SELECT
  USING (
    api_key_id IN (
      SELECT id FROM public.agent_api_keys
      WHERE buyer_wallet = ((current_setting('request.jwt.claims', true))::json ->> 'wallet_address')
    )
  );

CREATE POLICY "Service role manages usage"
  ON public.agent_api_usage FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');