-- Replace partial unique index with a full UNIQUE CONSTRAINT so it can be used
-- as an ON CONFLICT target by sync-drive-tasks.
DROP INDEX IF EXISTS public.tasks_external_id_unique;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_external_id_key UNIQUE (external_id);