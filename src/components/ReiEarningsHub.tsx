import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Coins, TrendingUp, Wallet, ChevronDown, ChevronUp, Copy, Check, Twitter, Share2, MousePointer, UserPlus, Briefcase } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ReiEarningsHubProps { registrationWallet?: string; connectedWallet?: string; xUserId?: string; }
interface AggregatedPoints { total_points: number; points_pending: number; lifetime_earnings_sol: number; wallet_count: number; }

export function ReiEarningsHub({ registrationWallet, connectedWallet, xUserId }: ReiEarningsHubProps) {
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const primaryWallet = connectedWallet || registrationWallet;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralUrl = referralCode ? `${baseUrl}/r/${referralCode}` : '';

  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['user-points-aggregated', xUserId, primaryWallet],
    queryFn: async (): Promise<AggregatedPoints> => {
      let walletAddresses: string[] = [];
      if (xUserId) { const { data: registries } = await supabase.from('rei_registry').select('wallet_address').eq('x_user_id', xUserId); if (registries && registries.length > 0) walletAddresses = registries.map(r => r.wallet_address); }
      if (connectedWallet && !walletAddresses.includes(connectedWallet)) walletAddresses.push(connectedWallet);
      if (registrationWallet && !walletAddresses.includes(registrationWallet)) walletAddresses.push(registrationWallet);
      if (walletAddresses.length === 0) return { total_points: 0, points_pending: 0, lifetime_earnings_sol: 0, wallet_count: 0 };
      const { data: walletRecords, error } = await supabase.from('user_points').select('total_points, points_pending, lifetime_earnings_sol, wallet_address').in('wallet_address', walletAddresses);
      if (error) throw error;
      let xUserRecords: any[] = [];
      if (xUserId) { const { data: xRecords } = await supabase.from('user_points').select('total_points, points_pending, lifetime_earnings_sol, wallet_address').eq('x_user_id', xUserId); xUserRecords = xRecords || []; }
      const seenWallets = new Set<string>();
      const allRecords = [...(walletRecords || []), ...xUserRecords].filter(r => { if (seenWallets.has(r.wallet_address)) return false; seenWallets.add(r.wallet_address); return true; });
      return allRecords.reduce<AggregatedPoints>((acc, record) => ({ total_points: acc.total_points + (record.total_points || 0), points_pending: acc.points_pending + (record.points_pending || 0), lifetime_earnings_sol: acc.lifetime_earnings_sol + (Number(record.lifetime_earnings_sol) || 0), wallet_count: acc.wallet_count + 1 }), { total_points: 0, points_pending: 0, lifetime_earnings_sol: 0, wallet_count: 0 });
    },
    enabled: !!(xUserId || primaryWallet),
    refetchInterval: 30000,
  });

  useEffect(() => {
    const fetchReferralCode = async () => {
      if (!primaryWallet || referralCode) return;
      try { const { data, error } = await supabase.functions.invoke('generate-referral-code', { body: { walletAddress: primaryWallet, xUserId } }); if (!error && data?.referralCode) setReferralCode(data.referralCode); } catch (err) { console.error('Error fetching referral code:', err); }
    };
    if (isExpanded) fetchReferralCode();
  }, [isExpanded, primaryWallet, xUserId, referralCode]);

  useEffect(() => {
    if (!primaryWallet) return;
    const channel = supabase.channel(`points-${primaryWallet}`).on('postgres_changes', { event: '*', schema: 'public', table: 'user_points', filter: `wallet_address=eq.${primaryWallet}` }, () => { setIsAnimating(true); queryClient.invalidateQueries({ queryKey: ['user-points-aggregated', xUserId, primaryWallet] }); setTimeout(() => setIsAnimating(false), 600); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [primaryWallet, xUserId, queryClient]);

  const totalPoints = pointsData?.total_points ?? 0;
  const pendingPoints = pointsData?.points_pending ?? 0;
  const lifetimeSol = pointsData?.lifetime_earnings_sol ?? 0;
  const walletCount = pointsData?.wallet_count ?? 0;

  if ((!primaryWallet && !xUserId) || (pointsLoading && !pointsData)) return null;

  const copyToClipboard = async () => { try { await navigator.clipboard.writeText(referralUrl); setCopied(true); toast.success('Link copied!'); setTimeout(() => setCopied(false), 2000); } catch { toast.error('Failed to copy'); } };
  const shareToTwitter = () => { const text = `Join me on Rei and discover web3 opportunities!`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`, '_blank'); };
  const shareNative = async () => { if (navigator.share) { try { await navigator.share({ title: 'Join Rei', text: 'Join me on Rei!', url: referralUrl }); } catch { /* cancelled */ } } else { copyToClipboard(); } };

  return (
    <div className={`fixed top-2 left-4 md:top-20 z-[60] transition-all duration-300 ease-out ${isExpanded ? 'w-72' : 'w-40'}`} style={{ background: 'rgba(20,20,20,0.92)', backdropFilter: 'blur(12px)', border: '0.5px solid hsla(0,0%,100%,0.08)', borderRadius: '20px', ...(isAnimating ? { borderColor: 'hsla(18,52%,82%,0.3)', transform: 'scale(1.02)' } : {}) }}>
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-3 flex items-center justify-between transition-colors" style={{ borderRadius: '20px' }}>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: 'hsla(18,52%,82%,0.12)' }}><Coins className="h-3.5 w-3.5" style={{ color: '#e8c4b8' }} /></div>
          <div className="text-left">
            <p style={{ fontWeight: 500, fontSize: '16px', lineHeight: 1, fontFamily: "'SF Mono', 'Consolas', monospace", color: isAnimating ? '#e8c4b8' : '#f0ede8' }}>{totalPoints.toLocaleString()}</p>
            <p style={{ fontSize: '10px', color: '#5c5a57', fontFamily: "'SF Mono', 'Consolas', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>{pendingPoints > 0 ? `+${pendingPoints} pending` : 'points'}</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" style={{ color: '#5c5a57' }} /> : <ChevronDown className="h-4 w-4" style={{ color: '#5c5a57' }} />}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3" style={{ animation: 'slideDown 0.2s ease-out' }}>
          <div style={{ height: '0.5px', background: 'hsla(0,0%,100%,0.08)' }} />
          <div className="flex gap-3" style={{ fontSize: '11px' }}>
            {walletCount > 1 && <div className="flex items-center gap-1" style={{ color: '#5c5a57' }}><Wallet className="h-3 w-3" /><span style={{ fontFamily: "'SF Mono', 'Consolas', monospace" }}>{walletCount} linked</span></div>}
            {lifetimeSol > 0 && <div className="flex items-center gap-1" style={{ color: '#5c5a57' }}><TrendingUp className="h-3 w-3" /><span style={{ fontFamily: "'SF Mono', 'Consolas', monospace" }}>{lifetimeSol.toFixed(4)} SOL</span></div>}
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
              <button onClick={copyToClipboard} className="w-full flex items-center gap-1.5 transition-colors" style={{ height: '32px', padding: '0 8px', background: '#1e1e1e', borderRadius: '8px', fontSize: '11px', fontFamily: "'SF Mono', 'Consolas', monospace", color: '#5c5a57', border: '0.5px solid hsla(0,0%,100%,0.08)' }}>
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