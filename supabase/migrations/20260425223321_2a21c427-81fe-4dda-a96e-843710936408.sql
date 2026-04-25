-- Some rows may have NULL x_user_id; partial unique index allows the upsert onConflict target
-- while still permitting future NULLs. But Postgres ON CONFLICT requires a constraint or unique index
-- covering the column. A regular unique index on x_user_id (treats NULLs as distinct) works.
CREATE UNIQUE INDEX IF NOT EXISTS rei_registry_x_user_id_key
  ON public.rei_registry (x_user_id)
  WHERE x_user_id IS NOT NULL;