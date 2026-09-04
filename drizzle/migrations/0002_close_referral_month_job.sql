-- Locks in the previous month's top 10 referrers. Idempotent.
CREATE OR REPLACE FUNCTION public.close_referral_month(p_month date DEFAULT NULL)
RETURNS TABLE(period_month date, winners integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target date;
  cnt integer;
BEGIN
  target := date_trunc('month', COALESCE(
    p_month,
    ((now() AT TIME ZONE 'utc')::date - interval '1 month')::date
  ))::date;

  DELETE FROM public.referral_leaderboard_snapshots s WHERE s.period_month = target;

  INSERT INTO public.referral_leaderboard_snapshots
    (period_month, rank, wallet_address, x_user_id, x_handle, referral_code, points, conversions, pot_share_pct)
  SELECT target, l.rank, l.wallet_address, l.x_user_id, l.x_handle, l.referral_code,
         l.points, l.conversions, l.pot_share_pct
  FROM public.referral_leaderboard(target) l
  WHERE l.rank <= 10;

  SELECT count(*) INTO cnt
  FROM public.referral_leaderboard_snapshots s WHERE s.period_month = target;

  PERFORM public.log_ops_event(
    'referral', 'close-referral-month', 'success',
    format('Closed %s with %s winners', to_char(target, 'YYYY-MM'), cnt),
    jsonb_build_object('month', to_char(target, 'YYYY-MM'), 'winners', cnt),
    NULL
  );

  RETURN QUERY SELECT target, cnt;
END;
$$;

REVOKE ALL ON FUNCTION public.close_referral_month(date) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_referral_month(date) TO service_role;

-- Monthly, on the 1st at 00:15 UTC.
SELECT cron.schedule(
  'close-referral-month',
  '15 0 1 * *',
  $$ SELECT public.close_referral_month(); $$
);