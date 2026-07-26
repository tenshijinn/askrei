ALTER TABLE public.rei_registry
  ADD COLUMN IF NOT EXISTS evm_wallet_address text;

CREATE UNIQUE INDEX IF NOT EXISTS rei_registry_evm_wallet_address_unique
  ON public.rei_registry (lower(evm_wallet_address))
  WHERE evm_wallet_address IS NOT NULL;