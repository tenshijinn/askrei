-- Monthly referral leaderboard: snapshots of closed months + live ranking function

CREATE TABLE public.referral_leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month date NOT NULL,
  rank integer NOT NULL,
  wallet_address text NOT NULL,
  x_user_id text,
  x_handle text,
  referral_code text,
  points integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  pot_share_pct numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (period_month, rank)
);

GRANT SELECT ON public.referral_leaderboard_snapshots TO anon;
GRANT SELECT ON public.referral_leaderboard_snapshots TO authenticated;
GRANT ALL ON public.referral_leaderboard_snapshots TO service_role;

ALTER TABLE public.referral_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard snapshots are publicly readable"
ON public.referral_leaderboard_snapshots
FOR SELECT
USING (true);

CREATE INDEX idx_leaderboard_snapshots_month ON public.referral_leaderboard_snapshots (period_month DESC, rank ASC);

-- Pot share by rank, per the Refer-To-Earn rules.
CREATE OR REPLACE FUNCTION public.referral_pot_share_pct(p_rank integer)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_rank = 1 THEN 25.0
    WHEN p_rank = 2 THEN 15.0
    WHEN p_rank = 3 THEN 10.0
    WHEN p_rank BETWEEN 4 AND 10 THEN 7.1
    ELSE 0.0
  END::numeric;
$$;

-- Live ranking for a UTC calendar month (defaults to the current month).
CREATE OR REPLACE FUNCTION public.referral_leaderboard(p_month date DEFAULT NULL)
RETURNS TABLE(
  rank integer,
  wallet_address text,
  x_user_id text,
  x_handle text,
  referral_code text,
  points bigint,
  conversions bigint,
  pot_share_pct numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT date_trunc('month', COALESCE(p_month, (now() AT TIME ZONE 'utc')::date))::timestamptz AS start_ts,
           (date_trunc('month', COALESCE(p_month, (now() AT TIME ZONE 'utc')::date)) + interval '1 month')::timestamptz AS end_ts
  ),
  agg AS (
    SELECT rc.wallet_address,
           max(rc.x_user_id) AS x_user_id,
           min(rc.referral_code) AS referral_code,
           sum(COALESCE(conv.points_awarded, 0))::bigint AS points,
           count(*)::bigint AS conversions,
           min(conv.created_at) AS first_at
    FROM public.referral_conversions conv
    JOIN public.referral_codes rc ON rc.referral_code = conv.referral_code
    CROSS JOIN bounds b
    WHERE conv.created_at >= b.start_ts AND conv.created_at < b.end_ts
    GROUP BY rc.wallet_address
  ),
  ranked AS (
    SELECT row_number() OVER (ORDER BY a.points DESC, a.first_at ASC)::integer AS rank,
           a.wallet_address, a.x_user_id, a.referral_code, a.points, a.conversions
    FROM agg a
  )
  SELECT r.rank,
         r.wallet_address,
         r.x_user_id,
         (SELECT reg.handle FROM public.rei_registry reg
           WHERE (r.x_user_id IS NOT NULL AND reg.x_user_id = r.x_user_id)
              OR reg.wallet_address = r.wallet_address
           ORDER BY (reg.x_user_id = r.x_user_id) DESC NULLS LAST
           LIMIT 1) AS x_handle,
         r.referral_code,
         r.points,
         r.conversions,
         public.referral_pot_share_pct(r.rank) AS pot_share_pct
  FROM ranked r
  WHERE r.rank <= 50
  ORDER BY r.rank;
$$;

GRANT EXECUTE ON FUNCTION public.referral_leaderboard(date) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.referral_pot_share_pct(integer) TO anon, authenticated, service_role;