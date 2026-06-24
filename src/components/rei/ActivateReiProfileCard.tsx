import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type StepStatus = 'done' | 'active' | 'pending' | 'checking' | 'unlocking';

interface Props {
  xUserId: string;
  initialFollowing?: boolean;
  onComplete: () => void;
}

const ASKREI_HANDLE = 'AskRei_';
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 60_000;

export function ActivateReiProfileCard({ xUserId, initialFollowing = false, onComplete }: Props) {
  const [followState, setFollowState] = useState<'idle' | 'checking' | 'done'>(
    initialFollowing ? 'done' : 'idle',
  );
  const [unlockState, setUnlockState] = useState<'pending' | 'unlocking' | 'done'>('pending');
  const [stalled, setStalled] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.round(POLL_TIMEOUT_MS / 1000));
  const pollRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const clearTimers = () => {
    if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
    if (timeoutRef.current) { window.clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (countdownRef.current) { window.clearInterval(countdownRef.current); countdownRef.current = null; }
  };

  useEffect(() => () => clearTimers(), []);

  // If already following on mount, run unlock sequence immediately
  useEffect(() => {
    if (initialFollowing && !completedRef.current) {
      completedRef.current = true;
      runUnlockSequence();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runUnlockSequence = () => {
    setUnlockState('unlocking');
    window.setTimeout(() => {
      setUnlockState('done');
      window.setTimeout(() => {
        onComplete();
      }, 700);
    }, 1200);
  };

  const startPolling = () => {
    clearTimers();
    setStalled(false);
    setSecondsLeft(Math.round(POLL_TIMEOUT_MS / 1000));
    countdownRef.current = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    pollRef.current = window.setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('twitter-oauth', {
          body: { action: 'checkFollow', x_user_id: xUserId },
        });
        if (error) return;
        if (data?.follows_askrei) {
          clearTimers();
          if (completedRef.current) return;
          completedRef.current = true;
          setFollowState('done');
          runUnlockSequence();
        }
      } catch {
        /* swallow; keep polling */
      }
    }, POLL_INTERVAL_MS);

    timeoutRef.current = window.setTimeout(() => {
      if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
      if (countdownRef.current) { window.clearInterval(countdownRef.current); countdownRef.current = null; }
      setSecondsLeft(0);
      setFollowState('idle');
      setStalled(true);
    }, POLL_TIMEOUT_MS);
  };

  const handleFollowClick = () => {
    window.open(`https://x.com/intent/follow?screen_name=${ASKREI_HANDLE}`, '_blank', 'noopener,noreferrer');
    setFollowState('checking');
    startPolling();
  };

  const handleCheckAgain = () => {
    setFollowState('checking');
    startPolling();
  };

  const step2Status: StepStatus =
    followState === 'done' ? 'done' : followState === 'checking' ? 'checking' : 'active';
  const step3Status: StepStatus =
    unlockState === 'done' ? 'done'
    : unlockState === 'unlocking' ? 'unlocking'
    : followState === 'done' ? 'active' : 'pending';

  const percent =
    unlockState === 'done' ? 100
    : unlockState === 'unlocking' ? 90
    : followState === 'done' ? 83
    : followState === 'checking' ? 70
    : 66;

  const CELLS = 36;
  const filled = Math.round((percent / 100) * CELLS);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: '#e8c4b8' }} />
          <h4 style={{ fontSize: '22px', fontWeight: 300, color: '#f0ede8', letterSpacing: '-0.025em' }}>
            Activate your Rei profile
          </h4>
        </div>
        <p style={{ fontSize: '13px', color: '#5c5a57' }}>
          A few quick steps to unlock your Proof-of-Talent experience.
        </p>
      </div>

      <div style={{ borderTop: '0.5px solid hsla(0,0%,100%,0.08)' }} />

      <div className="relative">
        {/* connector line */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '13px',
            top: '28px',
            bottom: '28px',
            width: '1px',
            background: 'hsla(0,0%,100%,0.08)',
          }}
        />
        <div className="space-y-5">
          <StepRow
            index={1}
            status="done"
            title="Verified X account"
            subtitle="Verified — bounty posters trust you instantly"
            right={<RightCircle status="done" />}
          />
          <StepRow
            index={2}
            status={step2Status}
            title="Activate AI Agent"
            subtitle={
              followState === 'done' ? (
                'Agent active — bounties incoming'
              ) : followState === 'checking' ? (
                `Connecting your agent… auto-stops in ${secondsLeft}s`
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <MarqueeRow
                    label="Activate for Rewards:"
                    items={['$SOL', 'Monke NFTs', '$USDG', 'Y00T NFTs', 'DeGods NFTs', 'Rei Points']}
                    duration={24}
                  />
                  <MarqueeRow
                    label="Activate for Functions:"
                    items={[
                      "Get Highest Paid Bounties DM'd [Opt-In]",
                      'Market Analysis',
                      'Daily Bounty Posts',
                      'Just tag @AskRei_ to ask bounty questions tailored to you',
                    ]}
                    duration={34}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <FollowButton onClick={handleFollowClick} />
                  </div>
                </div>
              )
            }
            right={
              followState === 'done' ? (
                <RightCircle status="done" />
              ) : followState === 'checking' ? (
                <CheckingPill secondsLeft={secondsLeft} />
              ) : (
                <RightCircle status="pending" />
              )
            }
          />
          <StepRow
            index={3}
            status={step3Status}
            title="Unlock your portal"
            subtitle={
              unlockState === 'done'
                ? 'Ready — welcome in'
                : unlockState === 'unlocking'
                ? 'Unlocking your portal…'
                : 'Your Proof-of-Talent dashboard, ready in seconds'
            }
            right={
              unlockState === 'done'
                ? <RightCircle status="done" />
                : unlockState === 'unlocking'
                ? <RightCircle status="checking" />
                : <RightCircle status="pending" />
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-[2px]">
          {Array.from({ length: CELLS }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '14px',
                borderRadius: '2px',
                background: i < filled ? '#e8c4b8' : 'hsla(0,0%,100%,0.06)',
                transition: 'background 220ms ease',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: '13px', color: '#f0ede8', fontWeight: 400, minWidth: '38px', textAlign: 'right' }}>
          {percent}%
        </span>
      </div>

      {unlockState === 'done' && (
        <p className="text-center" style={{ fontSize: '12px', color: '#a09e9a' }}>Redirecting…</p>
      )}

      {stalled && unlockState !== 'done' && (
        <p className="text-center" style={{ fontSize: '12px', color: '#5c5a57' }}>
          Didn't catch the follow yet — give it a moment, or{' '}
          <button
            onClick={handleCheckAgain}
            style={{ background: 'none', border: 'none', color: '#e8c4b8', textDecoration: 'underline', textUnderlineOffset: '3px', cursor: 'pointer', padding: 0, fontSize: '12px' }}
          >
            Re-check
          </button>
        </p>
      )}
    </div>
  );
}

function StepRow({
  index, status, title, subtitle, right,
}: { index: number; status: StepStatus; title: string; subtitle: React.ReactNode; right: React.ReactNode }) {
  const isDone = status === 'done';
  const isActive = status === 'active' || status === 'checking' || status === 'unlocking';
  return (
    <div className="flex items-start gap-4">
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: isDone ? '#e8c4b8' : 'transparent',
          border: isDone
            ? 'none'
            : isActive
            ? '1px solid #e8c4b8'
            : '1px solid hsla(0,0%,100%,0.18)',
          color: isDone ? '#0a0a0a' : isActive ? '#e8c4b8' : '#5c5a57',
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : index}
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#f0ede8', margin: 0 }}>{title}</p>
        <div style={{ fontSize: '12px', color: '#5c5a57', marginTop: '2px' }}>{subtitle}</div>
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
}

function RightCircle({ status }: { status: 'done' | 'checking' | 'pending' }) {
  if (status === 'checking') {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid hsla(0,0%,100%,0.18)' }}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#e8c4b8' }} />
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        border: '1px solid hsla(0,0%,100%,0.18)',
        color: status === 'done' ? '#e8c4b8' : 'transparent',
      }}
    >
      {status === 'done' && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
    </div>
  );
}

function FollowButton({ onClick }: { onClick: () => void }) {
  return (
    <>
      <style>{`
        @keyframes rei-heartbeat {
          0%, 28%, 70%, 100% {
            background: hsla(18,52%,82%,0.04);
            box-shadow: 0 0 0 0 hsla(18,52%,82%,0);
            border-color: hsla(18,52%,82%,0.3);
          }
          14% {
            background: hsla(18,52%,82%,0.22);
            box-shadow: 0 0 0 6px hsla(18,52%,82%,0.10);
            border-color: hsla(18,52%,82%,0.65);
          }
          42% {
            background: hsla(18,52%,82%,0.12);
            box-shadow: 0 0 0 10px hsla(18,52%,82%,0);
            border-color: hsla(18,52%,82%,0.4);
          }
        }
        .rei-follow-pulse { animation: rei-heartbeat 1.6s ease-in-out infinite; }
        .rei-follow-pulse:hover, .rei-follow-pulse:focus-visible {
          animation-play-state: paused;
          background: hsla(18,52%,82%,0.22) !important;
          border-color: hsla(18,52%,82%,0.65) !important;
        }
      `}</style>
      <button
        onClick={onClick}
        className="rei-follow-pulse flex items-center gap-1.5"
        style={{
          border: '1px solid hsla(18,52%,82%,0.3)',
          borderRadius: '8px',
          padding: '7px 14px',
          color: '#f0ede8',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <XGlyph />
        <span>Follow to Activate</span>
      </button>
    </>
  );
}

function CheckingPill({ secondsLeft }: { secondsLeft: number }) {
  return (
    <div
      className="flex items-center gap-1.5"
      style={{
        border: '1px solid hsla(18,52%,82%,0.3)',
        borderRadius: '8px',
        padding: '7px 14px',
        color: '#e8c4b8',
        fontSize: '12px',
        fontWeight: 500,
        background: 'hsla(18,52%,82%,0.06)',
      }}
    >
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Checking… {secondsLeft}s</span>
    </div>
  );
}

function XGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.797l-4.77-6.21L4.8 22H2.04l6.98-7.98L2 2h6.91l4.3 5.69L18.244 2Zm-2.38 18h1.76L7.22 4H5.36L15.864 20Z" />
    </svg>
  );
}

function MarqueeRow({ label, items, duration }: { label: string; items: string[]; duration: number }) {
  const renderItem = (key: string) => (
    <span key={key} style={{ display: 'inline-flex', whiteSpace: 'nowrap' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'inline-flex', whiteSpace: 'nowrap' }}>
          <span>
            {item.split('@AskRei_').map((chunk, j, arr) => (
              <span key={j}>
                {chunk}
                {j < arr.length - 1 && <span style={{ color: '#f0ede8' }}>@AskRei_</span>}
              </span>
            ))}
          </span>
          <span style={{ color: '#e8c4b8', padding: '0 12px' }}>|</span>
        </span>
      ))}
    </span>
  );
  return (
    <>
      <style>{`
        @keyframes rei-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .rei-marquee-track { animation: rei-marquee linear infinite; }
        .rei-marquee-pill:hover .rei-marquee-track { animation-play-state: paused; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            fontSize: '11px',
            color: '#5c5a57',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {label}
        </span>
        <div
          className="rei-marquee-pill"
          style={{
            flex: 1,
            minWidth: 0,
            border: '1px solid hsla(0,0%,100%,0.12)',
            borderRadius: '999px',
            padding: '5px 12px',
            background: 'hsla(0,0%,100%,0.02)',
            overflow: 'hidden',
          }}
        >
          <div
            className="rei-marquee-track"
            style={{
              display: 'inline-flex',
              whiteSpace: 'nowrap',
              fontSize: '12px',
              color: '#a09e9a',
              animationDuration: `${duration}s`,
              willChange: 'transform',
            }}
          >
            {renderItem('a')}
            {renderItem('b')}
          </div>
        </div>
      </div>
    </>
  );
}

