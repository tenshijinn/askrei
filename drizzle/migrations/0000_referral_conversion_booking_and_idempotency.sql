-- Allow a third conversion type for booking-link clicks
ALTER TABLE public.referral_conversions
  DROP CONSTRAINT IF EXISTS referral_conversions_conversion_type_check;

ALTER TABLE public.referral_conversions
  ADD CONSTRAINT referral_conversions_conversion_type_check
  CHECK (conversion_type IN ('registration', 'payment', 'booking'));

-- Idempotency key so a repeated webhook / retry cannot double-record a conversion
ALTER TABLE public.referral_conversions
  ADD COLUMN IF NOT EXISTS dedupe_key text;

CREATE UNIQUE INDEX IF NOT EXISTS referral_conversions_dedupe_key_uidx
  ON public.referral_conversions (dedupe_key)
  WHERE dedupe_key IS NOT NULL;

GRANT SELECT ON public.referral_conversions TO authenticated;
GRANT ALL ON public.referral_conversions TO service_role;
