import { useState } from 'react';
import { CalendarDays, Check, Copy, Gift, Loader2, MousePointer, Share2, Twitter, UserPlus, Briefcase, CalendarClock, Coins, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useReferralAndPoints } from '@/hooks/useReferralAndPoints';

interface ReferralStatsCardProps {
  registrationWallet?: string;
  connectedWallet?: string;
  xUserId?: string;
}

const mono = "'SF Mono', 'Consolas', monospace";

export function ReferralStatsCard({ registrationWallet, connectedWallet, xUserId }: ReferralStatsCardProps) {
  const [copied, setCopied] = useState(false);
  const { points, referral, referralLoading, referralError, referralCode, referralUrl } =
    useReferralAndPoints({ registrationWallet, connectedWallet, xUserId });

  const copyToClipboard = async () => {
    try { await navigator.clipboard.writeText(referralUrl); setCopied(true); toast.success('Link copied!'); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error('Failed to copy'); }
  };
  const shareToTwitter = () => {
    const text = 'Join me on Rei and discover web3 opportunities!';
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`, '_blank');
  };
  const shareNative = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Join Rei', text: 'Join me on Rei!', url: referralUrl }); } catch { /* cancelled */ } }
    else copyToClipboard();
  };

  const monthly = [
    { label: 'Referrals this month', value: referral?.referralsThisMonth ?? 0, icon: CalendarDays },
    { label: 'Points this month', value: referral?.pointsThisMonth ?? 0, icon: Gift },
    { label: 'Clicks this month', value: referral?.clicksThisMonth ?? 0, icon: MousePointer },
  ];

  const allTime = [
    { label: 'All-time referrals', value: referral?.allTimeReferrals ?? 0, icon: Users },
    { label: 'All-time referral points', value: referral?.pointsAllTime ?? 0, icon: Coins },
    { label: 'All-time clicks', value: referral?.allTimeClicks ?? 0, icon: MousePointer },
  ];

  const breakdown = [
    { label: 'Registrations', icon: UserPlus, month: referral?.registrationsThisMonth ?? 0, total: referral?.registrationsAllTime ?? 0 },
    { label: 'Purchases', icon: Briefcase, month: referral?.paymentsThisMonth ?? 0, total: referral?.paymentsAllTime ?? 0 },
    { label: 'Bookings', icon: CalendarClock, month: referral?.bookingsThisMonth ?? 0, total: referral?.bookingsAllTime ?? 0 },
  ];

  return (
    <div className="space-y-3">
      <div className="rei-stat-card" style={{ padding: '14px 16px' }}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4" style={{ color: '#e8c4b8' }} />
              <span style={{ fontSize: '12px', color: '#f0ede8', fontWeight: 500 }}>Points balance</span>
            </div>
            <p style={{ fontSize: '11px', color: '#5c5a57', margin: '4px 0 0' }}>
              Same balance shown in the floating points widget.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Total points', value: points.total_points.toLocaleString() },
            { label: 'Pending', value: points.points_pending.toLocaleString() },
            { label: 'Linked wallets', value: points.wallet_count.toLocaleString() },
            { label: 'Lifetime SOL', value: points.lifetime_earnings_sol.toFixed(4) },
          ].map(({ label, value }) => (
            <div key={label} className="rei-surface" style={{ padding: '12px' }}>
              <div style={{ fontSize: '20px', lineHeight: 1, color: '#f0ede8', fontFamily: mono }}>{value}</div>
              <div style={{ fontSize: '10px', color: '#5c5a57', marginTop: '6px', lineHeight: 1.25 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rei-stat-card" style={{ padding: '14px 16px' }}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4" style={{ color: '#e8c4b8' }} />
              <span style={{ fontSize: '12px', color: '#f0ede8', fontWeight: 500 }}>Referral rewards</span>
            </div>
            <p style={{ fontSize: '11px', color: '#5c5a57', margin: '4px 0 0' }}>Monthly points follow the UTC calendar month.</p>
          </div>
          {referralLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#a09e9a' }} />}
        </div>

        {referralError ? (
          <p style={{ fontSize: '12px', color: '#a09e9a', margin: 0 }}>Referral stats are temporarily unavailable.</p>
        ) : (
          <div className="space-y-3">
            {[{ heading: 'This month', items: monthly }, { heading: 'All time', items: allTime }].map(({ heading, items }) => (
              <div key={heading}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5c5a57', margin: '0 0 8px', fontWeight: 500 }}>{heading}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {items.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rei-surface" style={{ padding: '12px' }}>
                      <Icon className="h-3.5 w-3.5 mb-3" style={{ color: '#a09e9a' }} />
                      <div style={{ fontSize: '22px', lineHeight: 1, color: '#f0ede8', fontFamily: mono }}>{value.toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: '#5c5a57', marginTop: '6px', lineHeight: 1.25 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5c5a57', margin: '0 0 8px', fontWeight: 500 }}>Conversions by type</p>
              <div className="rei-surface" style={{ padding: '4px 12px' }}>
                {breakdown.map(({ label, icon: Icon, month, total }) => (
                  <div key={label} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '0.5px solid hsla(0,0%,100%,0.06)' }}>
                    <div className="flex items-center gap-2" style={{ fontSize: '12px', color: '#a09e9a' }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: 'hsla(18,52%,82%,0.6)' }} />{label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#f0ede8', fontFamily: mono }}>
                      {month.toLocaleString()} <span style={{ color: '#5c5a57' }}>/ {total.toLocaleString()} all time</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {referralCode && (
        <div className="rei-stat-card" style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5c5a57', margin: '0 0 8px', fontWeight: 500 }}>Your referral link</p>
          <button onClick={copyToClipboard} className="w-full flex items-center gap-1.5 mb-2" style={{ height: '36px', padding: '0 10px', background: '#1e1e1e', borderRadius: '8px', fontSize: '12px', fontFamily: mono, color: '#a09e9a', border: '0.5px solid hsla(0,0%,100%,0.08)' }}>
            {copied ? <Check className="h-3.5 w-3.5 shrink-0" style={{ color: '#e8c4b8' }} /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{referralUrl}</span>
          </button>
          <div className="flex gap-2">
            <button onClick={shareToTwitter} className="rei-chip flex-1 justify-center" style={{ padding: '6px 12px', fontSize: '12px' }}><Twitter className="h-3.5 w-3.5" />Post</button>
            <button onClick={shareNative} className="rei-chip flex-1 justify-center" style={{ padding: '6px 12px', fontSize: '12px' }}><Share2 className="h-3.5 w-3.5" />Share</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReferralStatsCard;
