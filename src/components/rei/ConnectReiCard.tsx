import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Copy, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  xUserId: string;
  initialFollowing?: boolean;
  onContinue: () => void;
}

const ASKREI_HANDLE = 'AskRei_';
const MCP_URL = 'https://rei.chat/functions/v1/mcp';
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 60_000;

export function ConnectReiCard({ xUserId, initialFollowing = false, onContinue }: Props) {
  const { toast } = useToast();
  const [followState, setFollowState] = useState<'idle' | 'checking' | 'done'>(
    initialFollowing ? 'done' : 'idle',
  );
  const [secondsLeft, setSecondsLeft] = useState(Math.round(POLL_TIMEOUT_MS / 1000));
  const pollRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
    if (timeoutRef.current) { window.clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (countdownRef.current) { window.clearInterval(countdownRef.current); countdownRef.current = null; }
  };
  useEffect(() => () => clearTimers(), []);

  const startPolling = () => {
    clearTimers();
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
          setFollowState('done');
        }
      } catch { /* keep polling */ }
    }, POLL_INTERVAL_MS);
    timeoutRef.current = window.setTimeout(() => {
      clearTimers();
      setFollowState((s) => (s === 'checking' ? 'idle' : s));
    }, POLL_TIMEOUT_MS);
  };

  const handleFollowClick = () => {
    window.open(`https://x.com/intent/follow?screen_name=${ASKREI_HANDLE}`, '_blank', 'noopener,noreferrer');
    setFollowState('checking');
    startPolling();
  };

  const copyMcpUrl = async () => {
    try {
      await navigator.clipboard.writeText(MCP_URL);
      toast({ title: 'MCP URL copied', description: 'Paste it into your AI assistant\'s connector settings.' });
    } catch {
      toast({ title: 'Copy failed', description: MCP_URL, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h4 style={{ fontSize: '22px', fontWeight: 300, color: '#f0ede8', letterSpacing: '-0.025em' }}>
          Connect Rei to your workflow
        </h4>
        <p style={{ fontSize: '13px', color: '#5c5a57' }}>
          All optional — you can skip and set these up later from your profile.
        </p>
      </div>

      {/* Primary: Follow on X */}
      <div>
        <div style={{ fontSize: '11px', color: '#5c5a57', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Recommended
        </div>
        <div
          className="rei-surface-2"
          style={{
            padding: '16px',
            borderColor: followState === 'done' ? 'hsla(18,52%,82%,0.4)' : 'hsla(18,52%,82%,0.22)',
            background: followState === 'done' ? 'hsla(18,52%,82%,0.06)' : undefined,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: followState === 'done' ? '#e8c4b8' : 'hsla(0,0%,100%,0.04)',
                border: '0.5px solid hsla(0,0%,100%,0.08)',
                color: followState === 'done' ? '#0a0a0a' : '#f0ede8',
              }}
            >
              {followState === 'done' ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <XGlyph />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#f0ede8', margin: 0 }}>
                Follow @AskRei_ on X
              </p>
              <p style={{ fontSize: '12px', color: '#a09e9a', margin: '4px 0 0', lineHeight: 1.5 }}>
                Get high-paying bounties DM'd to you, daily bounty posts, and tag <span style={{ color: '#e8c4b8' }}>@AskRei_</span> anywhere on X for tailored answers.
              </p>
            </div>
            <div className="flex-shrink-0">
              {followState === 'done' ? (
                <div
                  className="flex items-center gap-1.5"
                  style={{ border: '1px solid hsla(18,52%,82%,0.4)', borderRadius: '8px', padding: '7px 12px', color: '#e8c4b8', fontSize: '12px', fontWeight: 500 }}
                >
                  <Check className="h-3 w-3" />
                  <span>Following</span>
                </div>
              ) : followState === 'checking' ? (
                <div
                  className="flex items-center gap-1.5"
                  style={{ border: '1px solid hsla(18,52%,82%,0.3)', borderRadius: '8px', padding: '7px 12px', color: '#e8c4b8', fontSize: '12px', fontWeight: 500, background: 'hsla(18,52%,82%,0.06)' }}
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Checking… {secondsLeft}s</span>
                </div>
              ) : (
                <FollowButton onClick={handleFollowClick} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary: Use Rei from AI assistants (MCP) */}
      <div>
        <div style={{ fontSize: '11px', color: '#5c5a57', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Or use Rei inside your AI assistant
        </div>
        <p style={{ fontSize: '12px', color: '#a09e9a', margin: '0 0 12px', lineHeight: 1.5 }}>
          Rei speaks <span style={{ color: '#e8c4b8' }}>MCP</span> — plug it into ChatGPT, Claude, Cursor, or any MCP-compatible client.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '8px',
          }}
        >
          <McpTile
            label="ChatGPT"
            sub="Connectors"
            onClick={() => {
              copyMcpUrl();
              window.open('https://chatgpt.com/#settings/Connectors', '_blank', 'noopener,noreferrer');
            }}
          />
          <McpTile
            label="Claude"
            sub="Connectors"
            onClick={() => {
              copyMcpUrl();
              window.open('https://claude.ai/settings/connectors', '_blank', 'noopener,noreferrer');
            }}
          />
          <McpTile
            label="Cursor"
            sub="MCP settings"
            onClick={() => {
              copyMcpUrl();
              window.open('https://docs.cursor.com/context/model-context-protocol', '_blank', 'noopener,noreferrer');
            }}
          />
          <McpTile
            label="Copy MCP URL"
            sub="Any client"
            icon={<Copy className="h-3.5 w-3.5" />}
            onClick={copyMcpUrl}
          />
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={() => { clearTimers(); onContinue(); }}
        className="btn-manga btn-manga-primary w-full flex items-center justify-center gap-2"
        style={{ borderRadius: '28px', padding: '11px 22px', cursor: 'pointer' }}
      >
        <span>Continue → Connect wallets</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function McpTile({ label, sub, onClick, icon }: { label: string; sub: string; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rei-surface-2"
      style={{
        padding: '12px',
        borderRadius: '10px',
        textAlign: 'left',
        cursor: 'pointer',
        background: 'hsla(0,0%,100%,0.02)',
        transition: 'border-color 160ms ease, background 160ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsla(18,52%,82%,0.4)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
    >
      <div className="flex items-center gap-1.5" style={{ marginBottom: '4px' }}>
        {icon}
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#f0ede8' }}>{label}</span>
      </div>
      <span style={{ fontSize: '11px', color: '#5c5a57' }}>{sub}</span>
    </button>
  );
}

function FollowButton({ onClick }: { onClick: () => void }) {
  return (
    <>
      <style>{`
        @keyframes rei-heartbeat-2 {
          0%, 28%, 70%, 100% { background: hsla(18,52%,82%,0.04); box-shadow: 0 0 0 0 hsla(18,52%,82%,0); border-color: hsla(18,52%,82%,0.3); }
          14% { background: hsla(18,52%,82%,0.22); box-shadow: 0 0 0 6px hsla(18,52%,82%,0.10); border-color: hsla(18,52%,82%,0.65); }
          42% { background: hsla(18,52%,82%,0.12); box-shadow: 0 0 0 10px hsla(18,52%,82%,0); border-color: hsla(18,52%,82%,0.4); }
        }
        .rei-follow-pulse-2 { animation: rei-heartbeat-2 1.6s ease-in-out infinite; }
        .rei-follow-pulse-2:hover { animation-play-state: paused; background: hsla(18,52%,82%,0.22) !important; border-color: hsla(18,52%,82%,0.65) !important; }
      `}</style>
      <button
        onClick={onClick}
        className="rei-follow-pulse-2 flex items-center gap-1.5"
        style={{ border: '1px solid hsla(18,52%,82%,0.3)', borderRadius: '8px', padding: '7px 14px', color: '#f0ede8', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
      >
        <XGlyph />
        <span>Follow</span>
      </button>
    </>
  );
}

function XGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.797l-4.77-6.21L4.8 22H2.04l6.98-7.98L2 2h6.91l4.3 5.69L18.244 2Zm-2.38 18h1.76L7.22 4H5.36L15.864 20Z" />
    </svg>
  );
}
