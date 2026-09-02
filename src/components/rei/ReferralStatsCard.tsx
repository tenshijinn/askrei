import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Gift, Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ReferralStatsCardProps {
  walletAddress?: string;
  xUserId?: string;
}

interface ReferralStats {
  allTimeReferrals: number;
  referralsThisMonth: number;
  pointsThisMonth: number;
  pointsAllTime: number;
}

const statItems = [
  { key: 'allTimeReferrals', label: 'All-time referrals', icon: Users },
  { key: 'referralsThisMonth', label: 'Referrals this month', icon: CalendarDays },
  { key: 'pointsThisMonth', label: 'Points this month', icon: Gift },
] as const;

export function ReferralStatsCard({ walletAddress, xUserId }: ReferralStatsCardProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['referral-stats', walletAddress, xUserId],
    queryFn: async (): Promise<ReferralStats> => {
      const { data: result, error } = await supabase.functions.invoke('referral-stats', {
        body: { walletAddress, xUserId },
      });
      if (error) throw error;
      return result as ReferralStats;
    },
    enabled: Boolean(walletAddress || xUserId),
    staleTime: 60_000,
  });

  return (
    <div className="rei-stat-card" style={{ padding: '14px 16px' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4" style={{ color: '#e8c4b8' }} />
            <span style={{ fontSize: '12px', color: '#f0ede8', fontWeight: 500 }}>Referral rewards</span>
          </div>
          <p style={{ fontSize: '11px', color: '#5c5a57', margin: '4px 0 0' }}>Monthly points follow the UTC calendar month.</p>
        </div>
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#a09e9a' }} />}
      </div>

      {isError ? (
        <p style={{ fontSize: '12px', color: '#a09e9a', margin: 0 }}>Referral stats are temporarily unavailable.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {statItems.map(({ key, label, icon: Icon }) => (
            <div key={key} className="rei-surface" style={{ padding: '12px' }}>
              <Icon className="h-3.5 w-3.5 mb-3" style={{ color: '#a09e9a' }} />
              <div style={{ fontSize: '22px', lineHeight: 1, color: '#f0ede8', fontFamily: "'SF Mono', 'Consolas', monospace" }}>
                {(data?.[key] ?? 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#5c5a57', marginTop: '6px', lineHeight: 1.25 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReferralStatsCard;
