CREATE OR REPLACE VIEW public.v_public_rei_participants
WITH (security_invoker = false) AS
SELECT
  r.id,
  r.x_user_id,
  r.handle,
  r.display_name,
  r.profile_image_url,
  r.verified,
  r.wallet_address,
  r.evm_wallet_address,
  r.diamond_score,
  r.diamond_tier,
  NULLIF((r.wallet_behaviour -> 'subscores' -> 'community' ->> 'score'), '')::numeric AS community_score,
  NULLIF((r.wallet_behaviour -> 'subscores' -> 'confidence' ->> 'score'), '')::numeric AS confidence_score,
  NULLIF((r.wallet_behaviour -> 'subscores' -> 'risk' ->> 'score'), '')::numeric AS risk_score,
  r.created_at
FROM public.rei_registry r
ORDER BY r.diamond_score DESC NULLS LAST, r.created_at DESC;

GRANT SELECT ON public.v_public_rei_participants TO anon, authenticated;
GRANT SELECT ON public.v_public_rei_participants TO service_role;