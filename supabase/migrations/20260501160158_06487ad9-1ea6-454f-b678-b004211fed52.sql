-- Required for ON CONFLICT (external_id) upserts from sync-drive-tasks.
-- Partial unique index so we don't break existing manual rows that have external_id = NULL.
CREATE UNIQUE INDEX IF NOT EXISTS tasks_external_id_unique
  ON public.tasks (external_id)
  WHERE external_id IS NOT NULL;