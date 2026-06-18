import { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';

// One-line swap: when you have @AskRei_'s numeric Twitter user ID, set it here
// and the CTA becomes a direct DM-compose link with "/start" prefilled.
// Lookup once at https://tweeterid.com or via any X API call.
const ASKREI_RECIPIENT_ID: string | null = '1796358502933200896';
const TWITTER_URL = ASKREI_RECIPIENT_ID
  ? `https://x.com/messages/compose?recipient_id=${ASKREI_RECIPIENT_ID}&text=${encodeURIComponent('/start')}`
  : 'https://x.com/AskRei_';

export const NotificationsBellButton = () => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }} className="rei-notifs">
      <style>{`
        @keyframes rei-bell-ring {
          0%,100% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-12deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-8deg); }
          75% { transform: rotate(6deg); }
          90% { transform: rotate(-4deg); }
        }
        .rei-notifs button.rei-notifs-trigger:hover svg.rei-bell {
          animation: rei-bell-ring 700ms ease-in-out infinite;
          transform-origin: 50% 20%;
        }
        @keyframes rei-notifs-slidedown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="rei-chip rei-notifs-trigger"
        title="Notifications"
        aria-label="Notifications"
        style={{
          padding: '5px 10px',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Bell className="rei-bell" style={{ width: '14px', height: '14px', color: '#f0ede8' }} />
      </button>
      {open && (
        <div
          role="dialog"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 'min(320px, 88vw)',
            background: 'rgba(20,20,20,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '0.5px solid hsla(0,0%,100%,0.08)',
            borderRadius: '20px',
            padding: '14px',
            zIndex: 70,
            animation: 'rei-notifs-slidedown 0.2s ease-out',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5c5a57', fontWeight: 500, fontFamily: "'SF Mono', 'Consolas', monospace" }}>
              Bounty Notifications
            </p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#5c5a57' }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          </div>
          <p style={{ fontSize: '13px', color: '#f0ede8', lineHeight: 1.45, marginBottom: '6px', fontWeight: 700 }}>
            Never Miss High Paying Bounties Again
          </p>
          <p style={{ fontSize: '12px', color: '#a09e9a', lineHeight: 1.5, marginBottom: '6px' }}>
            Opt-in to bounty notifications on X with the highest paying bounties weekly.
          </p>
          <ul style={{ fontSize: '12px', color: '#a09e9a', lineHeight: 1.5, marginBottom: '12px', paddingLeft: '18px', listStyle: 'disc' }}>
            <li>DM her <strong style={{ color: '#f0ede8', fontFamily: "'SF Mono', 'Consolas', monospace", fontWeight: 700 }}>/start</strong> to get start notifications.</li>
            <li>DM her <strong style={{ color: '#f0ede8', fontFamily: "'SF Mono', 'Consolas', monospace", fontWeight: 700 }}>/stop</strong> to stop notifications.</li>
          </ul>
          <a
            href={TWITTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-manga btn-manga-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px 14px',
              fontSize: '12px',
              textDecoration: 'none',
            }}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.91l-5.41-7.07L4.4 22H1.14l8.02-9.16L1 2h7.09l4.88 6.45L18.244 2zm-2.42 18h1.92L7.27 4H5.21l10.614 16z" />
            </svg>
            DM @AskRei_ on X
          </a>
        </div>
      )}
    </div>
  );
};

export default NotificationsBellButton;
