import { useMemo, useState } from 'react';
import { Copy, Crown, Loader2, MessageCircle, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useReferralLeaderboard, type LeaderboardRow } from '@/hooks/useReferralLeaderboard';

interface Props {
  registrationWallet?: string;
  connectedWallet?: string;
  xUserId?: string;
  /** Compact mode is used when embedded inside the article page. */
  compact?: boolean;
}

const mono = "'SF Mono', 'Consolas', monospace";

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

const identity = (r: LeaderboardRow) => (r.handle ? `@${r.handle}` : r.walletMasked);

export function ReferralLeaderboardCard({
  registrationWallet,
  connectedWallet,
  xUserId,
  compact = false,
}: Props) {
  const wallet = connectedWallet || registrationWallet;
  const [month, setMonth] = useState<string | undefined>(undefined);
  const { data, isLoading, isError } = useReferralLeaderboard({
    month,
    walletAddress: wallet,
    xUserId,
  });

  const rows = data?.rows ?? [];
  const currentKey = useMemo(() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }, []);
  const shownMonth = data?.month ?? currentKey;
  const isCurrent = shownMonth === currentKey;

  const monthOptions = useMemo(() => {
    const set = new Set<string>([currentKey, ...(data?.availableMonths ?? [])]);
    return Array.from(set).sort().reverse();
  }, [currentKey, data?.availableMonths]);

  const announcement = useMemo(() => {
    if (rows.length === 0) return '';
    const lines = rows.map(
      (r) => `${r.rank}. ${identity(r)} — ${r.points.toLocaleString()} pts · ${r.potSharePct}% of the pot`,
    );
    return [
      `Rei referral leaderboard — ${monthLabel(shownMonth)}`,
      '',
      ...lines,
      '',
      'Community pot shares are on their way. Share your link and climb next month.',
    ].join('\n');
  }, [rows, shownMonth]);

  const copyAnnouncement = async () => {
    try {
      await navigator.clipboard.writeText(announcement);
      toast.success('Announcement copied — paste it into your X post');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const postToX = () => {
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(announcement)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const dmLink = (r: LeaderboardRow) =>
    r.xUserId
      ? `https://x.com/messages/compose?recipient_id=${r.xUserId}`
      : r.handle
        ? `https://x.com/${r.handle}`
        : null;

  return (
    <div className="space-y-3">
      <div className="rei-stat-card" style={{ padding: '14px 16px' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" style={{ color: '#e8c4b8' }} />
              <span style={{ fontSize: '12px', color: '#f0ede8', fontWeight: 500 }}>
                Top 10 referrers · {monthLabel(shownMonth)}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#5c5a57', margin: '4px 0 0' }}>
              {isCurrent
                ? 'Live standings. Resets on the 1st of every month (UTC).'
                : 'Final standings for this month.'}
            </p>
          </div>
          {monthOptions.length > 1 && (
            <select
              value={shownMonth}
              onChange={(e) => setMonth(e.target.value === currentKey ? undefined : e.target.value)}
              className="rei-chip"
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                color: '#f0ede8',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m} style={{ background: '#141414' }}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          {isLoading ? (
            <div className="flex items-center gap-2" style={{ fontSize: '12px', color: '#a09e9a' }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading leaderboard…
            </div>
          ) : isError ? (
            <p style={{ fontSize: '12px', color: '#ed565a' }}>Couldn't load the leaderboard right now.</p>
          ) : rows.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#a09e9a' }}>
              No referrals recorded this month yet — first mover takes 25% of the pot.
            </p>
          ) : (
            <div className="space-y-1">
              {rows.map((r) => (
                <div
                  key={`${r.rank}-${r.walletMasked}`}
                  className="flex items-center justify-between gap-3"
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: r.isViewer ? 'rgba(232,196,184,0.08)' : 'transparent',
                    border: r.isViewer
                      ? '0.5px solid rgba(232,196,184,0.28)'
                      : '0.5px solid hsla(0,0%,100%,0.05)',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: '12px',
                        color: r.rank <= 3 ? '#e8c4b8' : '#5c5a57',
                        width: 22,
                      }}
                    >
                      {r.rank}
                    </span>
                    {r.rank === 1 && <Crown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#e8c4b8' }} />}
                    <span
                      className="truncate"
                      style={{ fontSize: '12px', color: '#f0ede8', fontFamily: r.handle ? undefined : mono }}
                    >
                      {identity(r)}
                      {r.isViewer && <span style={{ color: '#a09e9a' }}> · you</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span style={{ fontSize: '12px', color: '#f0ede8', fontFamily: mono }}>
                      {r.points.toLocaleString()}
                    </span>
                    <span className="rei-chip" style={{ padding: '2px 8px', fontSize: '10px' }}>
                      {r.potSharePct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {data?.viewerRank && data.viewerRank.rank > 10 && (
          <p style={{ fontSize: '11px', color: '#a09e9a', marginTop: 12 }}>
            Your rank this month: <strong style={{ color: '#f0ede8' }}>#{data.viewerRank.rank}</strong> ·{' '}
            {data.viewerRank.points.toLocaleString()} pts — top 10 share the community pot.
          </p>
        )}
      </div>

      {!compact && (
        <div className="rei-stat-card" style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: '11px', color: '#5c5a57', margin: 0 }}>
            Pot split · 1st 25% · 2nd 15% · 3rd 10% · 4th–10th 7.1% each
          </p>
        </div>
      )}

      {data?.isAdmin && rows.length > 0 && (
        <div className="rei-stat-card" style={{ padding: '14px 16px' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span style={{ fontSize: '12px', color: '#f0ede8', fontWeight: 500 }}>
              Winners · {monthLabel(shownMonth)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={copyAnnouncement}
                className="rei-chip"
                style={{ padding: '5px 10px', fontSize: '11px', color: '#f0ede8', cursor: 'pointer' }}
              >
                <Copy className="h-3 w-3" /> Copy announcement
              </button>
              <button
                onClick={postToX}
                className="rei-chip"
                style={{ padding: '5px 10px', fontSize: '11px', color: '#f0ede8', cursor: 'pointer' }}
              >
                Post to X
              </button>
            </div>
          </div>
          <div className="space-y-1" style={{ marginTop: 12 }}>
            {rows.map((r) => {
              const dm = dmLink(r);
              return (
                <div
                  key={`admin-${r.rank}`}
                  className="flex items-center justify-between gap-3"
                  style={{ padding: '6px 0', borderTop: '0.5px solid hsla(0,0%,100%,0.05)' }}
                >
                  <div className="min-w-0">
                    <div style={{ fontSize: '12px', color: '#f0ede8' }}>
                      #{r.rank} {identity(r)} · {r.potSharePct}%
                    </div>
                    <div className="truncate" style={{ fontSize: '10px', color: '#5c5a57', fontFamily: mono }}>
                      {r.wallet}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(r.wallet || '');
                          toast.success('Wallet copied');
                        } catch {
                          toast.error('Failed to copy');
                        }
                      }}
                      className="rei-chip"
                      style={{ padding: '4px 8px', fontSize: '10px', color: '#f0ede8', cursor: 'pointer' }}
                    >
                      <Copy className="h-3 w-3" /> Wallet
                    </button>
                    {dm && (
                      <a
                        href={dm}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rei-chip"
                        style={{ padding: '4px 8px', fontSize: '10px', color: '#f0ede8' }}
                      >
                        <MessageCircle className="h-3 w-3" /> DM on X
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReferralLeaderboardCard;
