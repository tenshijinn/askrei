DROP INDEX IF EXISTS public.rei_registry_x_user_id_key;

CREATE UNIQUE INDEX rei_registry_x_user_id_key
  ON public.rei_registry (x_user_id);