REVOKE EXECUTE ON FUNCTION public.ops_health() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.ops_cron_health() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.ops_health() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ops_cron_health() FROM PUBLIC;