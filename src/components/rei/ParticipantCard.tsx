import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export interface Participant {
  id: string;
  handle: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  verified: boolean;
  solWallet: string | null;
  evmWallet: string | null;
  diamondScore: number | null;
  diamondTier: string | null;
  community: number | null;
  confidence: number | null;
  trust: number | null;
  createdAt: string;
  /** Engagement with the campaign this card is shown under. */
  impressions?: number;
  clicks?: number;
  firstSeen?: string;
  lastSeen?: string;
}


const PEACH = '#e8c4b8';
const MUTED = '#5c5a57';
const TEXT = '#f0ede8';

function truncate(addr: string) {
  return addr.length <= 12 ? addr : `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

const DiamondIcon = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={PEACH} strokeWidth="1.6" strokeLinejoin="round" width={size} height={size} aria-hidden>
    <path d="M6 3h12l3 6-9 12L3 9z" />
    <path d="M3 9h18M9 3 6 9l6 12M15 3l3 6-6 12" />
  </svg>
);

function WalletChip({ address, net }: { address: string; net: 'SOL' | 'EVM' }) {
  const [copied, setCopied] = useState(false);
  const tag =
    net === 'SOL'
      ? { bg: 'rgba(153,69,255,0.16)', fg: '#b98cff' }
      : { bg: 'rgba(98,126,234,0.16)', fg: '#8fa2f0' };
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(address).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          },
          () => {}
        );
      }}
      className="rei-chip"
      title={address}
      style={{ padding: '5px 9px', fontSize: 11, gap: 7, color: '#a09e9a', cursor: 'pointer' }}
    >
      <span
        style={{
          background: tag.bg,
          color: tag.fg,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.08em',
          padding: '2px 5px',
          borderRadius: 4,
        }}
      >
        {net}
      </span>
      <span style={{ fontFamily: 'ui-monospace, monospace' }}>{truncate(address)}</span>
      {copied ? <Check className="h-3 w-3" style={{ color: PEACH }} /> : <Copy className="h-3 w-3" style={{ opacity: 0.5 }} />}
    </button>
  );
}

function MetricChip({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rei-chip" style={{ padding: '5px 10px', fontSize: 11, gap: 6, color: '#a09e9a' }}>
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 9, color: MUTED }}>{label}</span>
      <span style={{ color: TEXT, fontWeight: 600 }}>{value === null ? '—' : value}</span>
    </div>
  );
}

export function ParticipantCard({ p }: { p: Participant }) {
  const [imgFailed, setImgFailed] = useState(false);
  const name = p.displayName || p.handle || 'Rei member';
  const initial = (name.replace(/^@/, '')[0] || 'R').toUpperCase();
  const showImg = !!p.profileImageUrl && !imgFailed;

  return (
    <div className="rei-stat-card rp-card" style={{ padding: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          flexShrink: 0,
          overflow: 'hidden',
          background: '#221f1e',
          border: '0.5px solid hsla(0,0%,100%,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: PEACH,
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        {showImg ? (
          <img
            src={p.profileImageUrl!}
            alt={name}
            onError={() => setImgFailed(true)}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          initial
        )}
      </div>

      <div className="rp-main" style={{ flex: 1, minWidth: 0, display: 'flex', gap: 18, alignItems: 'center' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <DiamondIcon />
            <span
              style={{
                fontSize: 14,
                color: TEXT,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name}
            </span>
          </div>
          {p.handle && (
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>@{p.handle.replace(/^@/, '')}</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {p.solWallet && <WalletChip address={p.solWallet} net="SOL" />}
            {p.evmWallet && <WalletChip address={p.evmWallet} net="EVM" />}
          </div>
        </div>

        <div className="rp-score" style={{ textAlign: 'right', flexShrink: 0, minWidth: 92 }}>
          <div style={{ fontSize: 26, color: TEXT, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {p.diamondScore === null ? '—' : p.diamondScore}
            <span style={{ fontSize: 12, color: MUTED, fontWeight: 400 }}> /100</span>
          </div>
          <div style={{ fontSize: 11, color: PEACH, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {p.diamondTier || '—'}
          </div>
          <div className="rp-metrics" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
            <MetricChip label="Community" value={p.community} />
            <MetricChip label="Confidence" value={p.confidence} />
            <MetricChip label="Trust" value={p.trust} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParticipantCard;
