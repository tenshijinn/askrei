import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardRow {
  rank: number;
  handle: string | null;
  walletMasked: string;
  points: number;
  conversions: number;
  potSharePct: number;
  isViewer: boolean;
  /** Admin-only fields, used for the winner confirmation panel. */
  wallet?: string;
  xUserId?: string | null;
  referralCode?: string | null;
}

export interface LeaderboardResponse {
  month: string;
  live: boolean;
  isAdmin: boolean;
  availableMonths: string[];
  rows: LeaderboardRow[];
  totalRanked: number;
  viewerRank: { rank: number; points: number; potSharePct: number } | null;
}

interface Args {
  month?: string;
  walletAddress?: string;
  xUserId?: string;
  enabled?: boolean;
}

/** Monthly top-10 referrer leaderboard. Current month is computed live;
 *  past months come from the locked-in snapshot. */
export function useReferralLeaderboard({ month, walletAddress, xUserId, enabled = true }: Args) {
  return useQuery({
    queryKey: ['referral-leaderboard', month ?? 'current', walletAddress, xUserId],
    queryFn: async (): Promise<LeaderboardResponse> => {
      const { data, error } = await supabase.functions.invoke('referral-leaderboard', {
        body: { month, walletAddress, xUserId },
      });
      if (error) throw error;
      return data as LeaderboardResponse;
    },
    enabled,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
