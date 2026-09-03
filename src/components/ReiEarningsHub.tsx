import { useState } from 'react';
import { Coins, TrendingUp, Wallet, ChevronDown, ChevronUp, Copy, Check, Twitter, Share2, MousePointer, UserPlus, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useReferralAndPoints } from '@/hooks/useReferralAndPoints';

interface ReiEarningsHubProps { registrationWallet?: string; connectedWallet?: string; xUserId?: string; }

const mono = "'SF Mono', 'Consolas', monospace";

export function ReiEarningsHub({ registrationWallet, connectedWallet, xUserId }: ReiEarningsHubProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const {
    primaryWallet, points, pointsLoading, hasPointsData,
    referral, referralCode, referralUrl, isAnimating,
  } = useReferralAndPoints({ registrationWallet, connectedWallet, xUserId });

  const { total_points: totalPoints, points_pending: pendingPoints, lifetime_earnings_sol: lifetimeSol, wallet_count: walletCount } = points;

  if ((!primaryWallet && !xUserId) || (pointsLoading && !hasPointsData)) return null;

  const copyToClipboard = async () => { try { await navigator.clipboard.writeText(referralUrl); setCopied(true); toast.success('Link copied!'); setTimeout(() => setCopied(false), 2000); } catch { toast.error('Failed to copy'); } };
  const shareToTwitter = () => { const text = `Join me on Rei and discover web3 opportunities!`; window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`, '_blank'); };
  const shareNative = async () => { if (navigator.share) { try { await navigator.share({ title: 'Join Rei', text: 'Join me on Rei!', url: referralUrl }); } catch { /* cancelled */ } } else { copyToClipboard(); } };

  // Compressed shorthand referral figures — the detailed breakdown lives in the account page.
  const shorthand = [
    { value: referral?.referralsThisMonth ?? 0, label: 'refs / mo' },
    { value: referral?.pointsThisMonth ?? 0, label: 'pts / mo' },
    { value: referral?.allTimeReferrals ?? 0, label: 'refs total' },
  ];

  return (
    <div id="rei-earnings-hub" className={`fixed top-2 left-4 md:top-20 z-[60] transition-all duration-300 ease-out ${isExpanded ? 'w-72' : 'w-40'}`} style={{ background: 'rgba(20,20,20,0.92)', backdropFilter: 'blur(12px)', border: '0.5px solid hsla(0,0%,100%,0.08)', borderRadius: '20px', ...(isAnimating ? { borderColor: 'hsla(18,52%,82%,0.3)', transform: 'scale(1.02)' } : {}) }}>
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-3 flex items-center justify-between transition-colors" style={{ borderRadius: '20px' }}>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: 'hsla(18,52%,82%,0.12)' }}><Coins className="h-3.5 w-3.5" style={{ color: '#e8c4b8' }} /></div>
          <div className="text-left">
            <p style={{ fontWeight: 500, fontSize: '16px', lineHeight: 1, fontFamily: mono, color: isAnimating ? '#e8c4b8' : '#f0ede8' }}>{totalPoints.toLocaleString()}</p>
            <p style={{ fontSize: '10px', color: '#5c5a57', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{pendingPoints > 0 ? `+${pendingPoints} pending` : 'points'}</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" style={{ color: '#5c5a57' }} /> : <ChevronDown className="h-4 w-4" style={{ color: '#5c5a57' }} />}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3" style={{ animation: 'slideDown 0.2s ease-out' }}>
          <div style={{ height: '0.5px', background: 'hsla(0,0%,100%,0.08)' }} />
          <div className="flex gap-3" style={{ fontSize: '11px' }}>
            {walletCount > 1 && <div className="flex items-center gap-1" style={{ color: '#5c5a57' }}><Wallet className="h-3 w-3" /><span style={{ fontFamily: mono }}>{walletCount} linked</span></div>}
            {lifetimeSol > 0 && <div className="flex items-center gap-1" style={{ color: '#5c5a57' }}><TrendingUp className="h-3 w-3" /><span style={{ fontFamily: mono }}>{lifetimeSol.toFixed(4)} SOL</span></div>}
          </div>
          <div className="rei-stat-card" style={{ padding: '10px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5c5a57', marginBottom: '6px', fontWeight: 500 }}>Referrals</p>
            <div className="grid grid-cols-3 gap-2">
              {shorthand.map(({ value, label }) => (
                <div key={label}>
                  <div style={{ fontSize: '15px', lineHeight: 1, color: '#f0ede8', fontFamily: mono }}>{value.toLocaleString()}</div>
                  <div style={{ fontSize: '9px', color: '#5c5a57', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rei-stat-card" style={{ padding: '10px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5c5a57', marginBottom: '6px', fontWeight: 500 }}>How to earn</p>
            <div className="space-y-1">
              {[{ icon: MousePointer, pts: '1 pt', label: 'per unique click' }, { icon: UserPlus, pts: '25 pts', label: 'per registration' }, { icon: Briefcase, pts: '100 pts', label: 'per paid job' }].map(({ icon: Icon, pts, label }) => (
                <div key={label} className="flex items-center gap-2" style={{ fontSize: '11px' }}><Icon className="h-3 w-3" style={{ color: 'hsla(18,52%,82%,0.6)' }} /><span style={{ color: '#5c5a57' }}>{pts}</span><span style={{ color: '#a09e9a' }}>{label}</span></div>
              ))}
            </div>
          </div>
          {referralCode && (
            <div className="space-y-2">
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5c5a57', fontWeight: 500 }}>Your referral link</p>
              <button onClick={copyToClipboard} className="w-full flex items-center gap-1.5 transition-colors" style={{ height: '32px', padding: '0 8px', background: '#1e1e1e', borderRadius: '8px', fontSize: '11px', fontFamily: mono, color: '#5c5a57', border: '0.5px solid hsla(0,0%,100%,0.08)' }}>
                {copied ? <Check className="h-3 w-3 shrink-0" style={{ color: '#e8c4b8' }} /> : <Copy className="h-3 w-3 shrink-0" />}<span className="truncate">/r/{referralCode}</span>
              </button>
              <div className="flex gap-1.5">
                <button onClick={shareToTwitter} className="rei-chip flex-1 justify-center" style={{ padding: '5px 10px', fontSize: '11px' }}><Twitter className="h-3 w-3" />Post</button>
                <button onClick={shareNative} className="rei-chip flex-1 justify-center" style={{ padding: '5px 10px', fontSize: '11px' }}><Share2 className="h-3 w-3" />Share</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
