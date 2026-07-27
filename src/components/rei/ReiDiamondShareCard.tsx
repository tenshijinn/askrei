import { useRef, useState } from 'react';
import { X, Download, Twitter } from 'lucide-react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

interface ReiDiamondShareCardProps {
  open: boolean;
  onClose: () => void;
  handle: string;
  displayName: string;
  profileImageUrl?: string | null;
  diamondScore: number;
  diamondTier: string;
  subscores?: {
    farmer?: { score: number };
    jeet?: { score: number };
    community?: { score: number };
    risk?: { score: number };
    confidence?: { score: number };
  } | null;
}

const tierEmoji = (tier: string) => {
  const t = tier.toLowerCase();
  if (t.includes('diamond')) return '💎';
  if (t.includes('platinum')) return '🔷';
  if (t.includes('gold')) return '🥇';
  if (t.includes('silver')) return '🥈';
  if (t.includes('bronze')) return '🥉';
  if (t.includes('coal')) return '⚫';
  return '✨';
};

export function ReiDiamondShareCard({
  open,
  onClose,
  handle,
  displayName,
  profileImageUrl,
  diamondScore,
  diamondTier,
  subscores,
}: ReiDiamondShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const chips = [
    { label: 'Community', value: subscores?.community?.score ?? null },
    { label: 'Confidence', value: subscores?.confidence?.score ?? null },
    { label: 'Trust', value: subscores?.risk?.score != null ? 100 - Math.round(subscores.risk.score) : null },
  ].filter((c) => c.value !== null) as { label: string; value: number }[];

  const download = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: '#0a0a0a' });
      const link = document.createElement('a');
      link.download = `reis-diamond-${handle}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Card saved');
    } catch {
      toast.error('Failed to render card');
    } finally {
      setBusy(false);
    }
  };

  const tweet = () => {
    const text = `My Rei's Diamond: ${diamondScore}/100 · ${diamondTier} ${tierEmoji(diamondTier)}\n\nGet yours at`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://rei.chat')}`,
      '_blank'
    );
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rei-surface"
        style={{ padding: 20, maxWidth: 520, width: '100%', position: 'relative' }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#a09e9a', cursor: 'pointer' }}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 style={{ fontSize: 16, fontWeight: 500, color: '#f0ede8', margin: '0 0 4px' }}>Rei's Diamond</h3>
        <p style={{ fontSize: 12, color: '#5c5a57', margin: '0 0 16px' }}>Share your on-chain rank.</p>

        <div
          ref={cardRef}
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            borderRadius: 20,
            background: 'linear-gradient(160deg, #1a1614 0%, #0a0a0a 60%, #14100e 100%)',
            border: '0.5px solid hsla(18,52%,82%,0.25)',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: '#f0ede8',
          }}
        >
          <div className="flex items-center gap-3">
            {profileImageUrl && (
              <img
                src={profileImageUrl}
                alt=""
                crossOrigin="anonymous"
                style={{ width: 48, height: 48, borderRadius: '50%', border: '0.5px solid hsla(18,52%,82%,0.3)' }}
              />
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}>{displayName}</div>
              <div style={{ fontSize: 12, color: '#a09e9a' }}>@{handle}</div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#5c5a57', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
              Rei's Diamond
            </div>
            <div style={{ fontSize: 88, fontWeight: 300, color: '#e8c4b8', lineHeight: 1, letterSpacing: '-0.04em', fontFamily: "'SF Mono', 'Consolas', monospace" }}>
              {Math.round(diamondScore)}
            </div>
            <div style={{ fontSize: 14, color: '#f0ede8', marginTop: 6 }}>
              {tierEmoji(diamondTier)} {diamondTier}
            </div>
          </div>

          <div>
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2" style={{ justifyContent: 'center', marginBottom: 12 }}>
                {chips.map((c) => (
                  <span
                    key={c.label}
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 100,
                      border: '0.5px solid hsla(18,52%,82%,0.3)',
                      color: '#e8c4b8',
                      fontFamily: "'SF Mono', 'Consolas', monospace",
                    }}
                  >
                    {c.label} · {Math.round(c.value)}
                  </span>
                ))}
              </div>
            )}
            <div style={{ textAlign: 'center', fontSize: 11, color: '#5c5a57', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              rei.chat
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={download}
            disabled={busy}
            className="btn-manga btn-manga-outline flex-1 flex items-center justify-center gap-2"
            style={{ borderRadius: 28, padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}
          >
            <Download className="h-3.5 w-3.5" /> Download PNG
          </button>
          <button
            onClick={tweet}
            className="btn-manga flex-1 flex items-center justify-center gap-2"
            style={{ borderRadius: 28, padding: '10px 18px', fontSize: 13, cursor: 'pointer', background: '#e8c4b8', color: '#0a0a0a', border: 'none' }}
          >
            <Twitter className="h-3.5 w-3.5" /> Share on X
          </button>
        </div>
      </div>
    </div>
  );
}
