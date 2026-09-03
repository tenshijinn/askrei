import { useEffect, useId, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Identity {
  registrationWallet?: string;
  connectedWallet?: string;
  xUserId?: string;
}

export interface AggregatedPoints {
  total_points: number;
  points_pending: number;
  lifetime_earnings_sol: number;
  wallet_count: number;
}

export interface ReferralStats {
  monthStart: string;
  allTimeReferrals: number;
  referralsThisMonth: number;
  pointsThisMonth: number;
  pointsAllTime: number;
  allTimeConversions: number;
  conversionsThisMonth: number;
  allTimeClicks: number;
  clicksThisMonth: number;
  registrationsAllTime: number;
  registrationsThisMonth: number;
  paymentsAllTime: number;
  paymentsThisMonth: number;
  bookingsAllTime: number;
  bookingsThisMonth: number;
}

const emptyPoints: AggregatedPoints = { total_points: 0, points_pending: 0, lifetime_earnings_sol: 0, wallet_count: 0 };

/** Single source of truth for the points balance, referral stats and referral link.
 *  Both the floating earnings widget and the account "Referrals & Points" card use
 *  this hook so they share one React Query cache entry and never disagree. */
export function useReferralAndPoints({ registrationWallet, connectedWallet, xUserId }: Identity) {
  const queryClient = useQueryClient();
  const primaryWallet = connectedWallet || registrationWallet;
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const pointsQuery = useQuery({
    queryKey: ['user-points-aggregated', xUserId, primaryWallet],
    queryFn: async (): Promise<AggregatedPoints> => {
      const walletAddresses: string[] = [];
      if (xUserId) {
        const { data: registries } = await supabase.from('rei_registry').select('wallet_address').eq('x_user_id', xUserId);
        (registries || []).forEach(r => { if (r.wallet_address && !walletAddresses.includes(r.wallet_address)) walletAddresses.push(r.wallet_address); });
      }
      [connectedWallet, registrationWallet].forEach(w => { if (w && !walletAddresses.includes(w)) walletAddresses.push(w); });
      if (walletAddresses.length === 0) return emptyPoints;

      const { data: walletRecords, error } = await supabase
        .from('user_points')
        .select('total_points, points_pending, lifetime_earnings_sol, wallet_address')
        .in('wallet_address', walletAddresses);
      if (error) throw error;

      let xUserRecords: typeof walletRecords = [];
      if (xUserId) {
        const { data: xRecords } = await supabase
          .from('user_points')
          .select('total_points, points_pending, lifetime_earnings_sol, wallet_address')
          .eq('x_user_id', xUserId);
        xUserRecords = xRecords || [];
      }

      const seen = new Set<string>();
      return [...(walletRecords || []), ...(xUserRecords || [])]
        .filter(r => (seen.has(r.wallet_address) ? false : (seen.add(r.wallet_address), true)))
        .reduce<AggregatedPoints>((acc, r) => ({
          total_points: acc.total_points + (r.total_points || 0),
          points_pending: acc.points_pending + (r.points_pending || 0),
          lifetime_earnings_sol: acc.lifetime_earnings_sol + (Number(r.lifetime_earnings_sol) || 0),
          wallet_count: acc.wallet_count + 1,
        }), { ...emptyPoints });
    },
    enabled: !!(xUserId || primaryWallet),
    refetchInterval: 30000,
  });

  const referralQuery = useQuery({
    queryKey: ['referral-stats', xUserId, primaryWallet],
    queryFn: async (): Promise<ReferralStats> => {
      const { data, error } = await supabase.functions.invoke('referral-stats', {
        body: { walletAddress: primaryWallet, xUserId },
      });
      if (error) throw error;
      return data as ReferralStats;
    },
    enabled: !!(xUserId || primaryWallet),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  // Referral link — fetched once per identity and shared by both surfaces.
  useEffect(() => {
    if (!primaryWallet || referralCode) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-referral-code', {
          body: { walletAddress: primaryWallet, xUserId },
        });
        if (!cancelled && !error && data?.referralCode) setReferralCode(data.referralCode);
      } catch (err) {
        console.error('Error fetching referral code:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [primaryWallet, xUserId, referralCode]);

  // Realtime points updates keep both surfaces in sync.
  const [isAnimating, setIsAnimating] = useState(false);
  // Unique per hook instance — two components sharing one channel name makes
  // supabase-js throw ("cannot add postgres_changes callbacks after subscribe").
  const instanceId = useId();
  useEffect(() => {
    if (!primaryWallet) return;
    const channel = supabase
      .channel(`points-${primaryWallet}-${instanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_points', filter: `wallet_address=eq.${primaryWallet}` }, () => {
        setIsAnimating(true);
        queryClient.invalidateQueries({ queryKey: ['user-points-aggregated', xUserId, primaryWallet] });
        queryClient.invalidateQueries({ queryKey: ['referral-stats', xUserId, primaryWallet] });
        setTimeout(() => setIsAnimating(false), 600);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [primaryWallet, xUserId, queryClient, instanceId]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return {
    primaryWallet,
    points: pointsQuery.data ?? emptyPoints,
    pointsLoading: pointsQuery.isLoading,
    hasPointsData: !!pointsQuery.data,
    referral: referralQuery.data,
    referralLoading: referralQuery.isLoading,
    referralError: referralQuery.isError,
    referralCode,
    referralUrl: referralCode ? `${baseUrl}/r/${referralCode}` : '',
    isAnimating,
  };
}
