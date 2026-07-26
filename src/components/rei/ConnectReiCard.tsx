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

const AI_LINKS = {
  ChatGPT: 'https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt',
  Claude: 'https://claude.com/docs/connectors/custom/remote-mcp',
  Cursor: 'https://docs.cursor.com/context/model-context-protocol',
} as const;

export function ConnectReiCard({ xUserId, initialFollowing = false, onContinue }: Props) {
  const { toast } = useToast();
  const [followState, setFollowState] = useState<'idle' | 'checking' | 'done'>(
    initialFollowing ? 'done' : 'idle',
  );
  const [secondsLeft, setSecondsLeft] = useState(Math.round(POLL_TIMEOUT_MS / 1000));
  const [iconIndex, setIconIndex] = useState(0);
  const pollRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
    if (timeoutRef.current) { window.clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (countdownRef.current) { window.clearInterval(countdownRef.current); countdownRef.current = null; }
  };
  useEffect(() => () => clearTimers(), []);

  // Rotate AI icons every 2s
  useEffect(() => {
    const id = window.setInterval(() => setIconIndex((i) => (i + 1) % 3), 2000);
    return () => window.clearInterval(id);
  }, []);

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

  const aiIcons = [
    <CursorGlyph key="cursor" />,
    <ChatGPTGlyph key="chatgpt" />,
    <ClaudeGlyph key="claude" />,
  ];

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

      {/* Card 1: Follow on X */}
      <div>
        <div style={{ fontSize: '11px', color: '#e8c4b8', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
          Recommended
        </div>
        <div
          className="rei-surface-2"
          style={{
            padding: '20px',
            borderRadius: '12px',
            borderColor: followState === 'done' ? 'hsla(18,52%,82%,0.4)' : 'hsla(18,52%,82%,0.22)',
            background: followState === 'done' ? 'hsla(18,52%,82%,0.06)' : undefined,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: '56px', height: '56px', borderRadius: '12px',
                background: followState === 'done' ? '#e8c4b8' : 'hsla(0,0%,100%,0.03)',
                border: '0.5px solid hsla(0,0%,100%,0.08)',
                color: followState === 'done' ? '#0a0a0a' : '#f0ede8',
              }}
            >
              {followState === 'done' ? <Check className="h-6 w-6" strokeWidth={2.5} /> : <XGlyph size={22} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '16px', fontWeight: 500, color: '#f0ede8', margin: 0, letterSpacing: '-0.01em' }}>
                Activate Rei Agent with X
              </p>
              <p style={{ fontSize: '13px', color: '#a09e9a', margin: '4px 0 0', lineHeight: 1.55 }}>
                Get high-paying bounties DM'd to you, daily bounty posts, and tag <span style={{ color: '#e8c4b8' }}>@AskRei_</span> anywhere on X for tailored answers.
              </p>
            </div>
            <div className="flex-shrink-0">
              {followState === 'done' ? (
                <div
                  className="flex items-center gap-1.5"
                  style={{ border: '1px solid hsla(18,52%,82%,0.4)', borderRadius: '10px', padding: '10px 16px', color: '#e8c4b8', fontSize: '13px', fontWeight: 500 }}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Following</span>
                </div>
              ) : followState === 'checking' ? (
                <div
                  className="flex items-center gap-1.5"
                  style={{ border: '1px solid hsla(18,52%,82%,0.3)', borderRadius: '10px', padding: '10px 16px', color: '#e8c4b8', fontSize: '13px', fontWeight: 500, background: 'hsla(18,52%,82%,0.06)' }}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Checking… {secondsLeft}s</span>
                </div>
              ) : (
                <FollowButton onClick={handleFollowClick} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: AI Assistants (MCP) */}
      <div>
        <div style={{ fontSize: '11px', color: '#e8c4b8', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
          Or use Rei inside your AI assistant
        </div>
        <div
          className="rei-surface-2"
          style={{ padding: '20px', borderRadius: '12px' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: '56px', height: '56px', borderRadius: '12px',
                background: 'hsla(0,0%,100%,0.03)',
                border: '0.5px solid hsla(0,0%,100%,0.08)',
                color: '#f0ede8',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <RotatingIcon icons={aiIcons} index={iconIndex} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '16px', fontWeight: 500, color: '#f0ede8', margin: 0, letterSpacing: '-0.01em' }}>
                Activate Rei with AI Assistants
              </p>
              <p style={{ fontSize: '13px', color: '#a09e9a', margin: '4px 0 0', lineHeight: 1.55 }}>
                Connect Rei to{' '}
                <AiLink href={AI_LINKS.ChatGPT}>ChatGPT</AiLink>,{' '}
                <AiLink href={AI_LINKS.Claude}>Claude</AiLink>,{' '}
                <AiLink href={AI_LINKS.Cursor}>Cursor</AiLink>, or any MCP-compatible client.
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={copyMcpUrl}
                className="flex items-center gap-2"
                style={{
                  border: '1px solid hsla(18,52%,82%,0.4)',
                  background: '#e8c4b8',
                  color: '#0a0a0a',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy MCP URL</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={() => { clearTimers(); onContinue(); }}
        className="btn-manga btn-manga-primary w-full flex items-center justify-center gap-2"
        style={{ borderRadius: '28px', padding: '11px 22px', cursor: 'pointer' }}
      >
        <span>Finish setup</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function AiLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#e8c4b8', textDecoration: 'underline', textUnderlineOffset: '2px' }}
    >
      {children}
    </a>
  );
}

function RotatingIcon({ icons, index }: { icons: React.ReactNode[]; index: number }) {
  return (
    <>
      <style>{`
        @keyframes rei-icon-fade {
          0% { opacity: 0; transform: scale(0.85); }
          15%, 85% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.85); }
        }
        .rei-rotating-icon { animation: rei-icon-fade 2s ease-in-out; }
      `}</style>
      <div key={index} className="rei-rotating-icon flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
        {icons[index]}
      </div>
    </>
  );
}

function FollowButton({ onClick }: { onClick: () => void }) {
  return (
    <>
      <style>{`
        @keyframes rei-heartbeat-2 {
          0%, 28%, 70%, 100% { background: #e8c4b8; box-shadow: 0 0 0 0 hsla(18,52%,82%,0); }
          14% { background: #eecfc4; box-shadow: 0 0 0 6px hsla(18,52%,82%,0.15); }
          42% { background: #e8c4b8; box-shadow: 0 0 0 10px hsla(18,52%,82%,0); }
        }
        .rei-follow-pulse-2 { animation: rei-heartbeat-2 1.6s ease-in-out infinite; }
        .rei-follow-pulse-2:hover { animation-play-state: paused; }
      `}</style>
      <button
        onClick={onClick}
        className="rei-follow-pulse-2 flex items-center gap-2"
        style={{ border: '1px solid hsla(18,52%,82%,0.5)', background: '#e8c4b8', color: '#0a0a0a', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
      >
        <XGlyph size={13} />
        <span>Follow</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </>
  );
}

function XGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.797l-4.77-6.21L4.8 22H2.04l6.98-7.98L2 2h6.91l4.3 5.69L18.244 2Zm-2.38 18h1.76L7.22 4H5.36L15.864 20Z" />
    </svg>
  );
}

function CursorGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 2l16 9-7 2-2 7L4 2z" />
    </svg>
  );
}

function ChatGPTGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22.28 10.06a5.75 5.75 0 00-.5-4.72 5.82 5.82 0 00-6.27-2.79 5.82 5.82 0 00-9.87 2.09 5.82 5.82 0 00-3.89 2.82 5.82 5.82 0 00.72 6.83 5.75 5.75 0 00.5 4.72 5.82 5.82 0 006.27 2.79 5.82 5.82 0 009.87-2.09 5.82 5.82 0 003.89-2.82 5.82 5.82 0 00-.72-6.83zM13.5 21.5a4.32 4.32 0 01-2.77-1l.14-.08 4.61-2.66a.75.75 0 00.38-.65v-6.5l1.95 1.13a.07.07 0 01.04.05v5.38a4.33 4.33 0 01-4.35 4.33zM4.19 17.53a4.31 4.31 0 01-.51-2.9l.14.08 4.61 2.66a.75.75 0 00.75 0l5.63-3.25v2.25a.07.07 0 01-.03.06L10.12 19a4.33 4.33 0 01-5.93-1.47zM3.02 8.34a4.31 4.31 0 012.25-1.9v5.47a.74.74 0 00.37.65l5.6 3.24-1.95 1.12a.07.07 0 01-.06 0L4.57 14.24a4.33 4.33 0 01-1.55-5.9zm16.02 3.73l-5.63-3.26 1.95-1.12a.07.07 0 01.06 0l4.66 2.68a4.33 4.33 0 01-.65 7.83v-5.48a.75.75 0 00-.39-.65zm1.94-2.92l-.14-.08L16.23 6.4a.75.75 0 00-.76 0L9.85 9.65V7.4a.06.06 0 01.03-.06l4.66-2.68a4.33 4.33 0 016.44 4.48zM8.79 13.16l-1.95-1.12a.07.07 0 01-.04-.06V6.6a4.33 4.33 0 017.1-3.33l-.14.08-4.61 2.66a.75.75 0 00-.38.65zm1.06-2.28L12.36 9.43l2.51 1.45v2.9l-2.5 1.45-2.52-1.45z" />
    </svg>
  );
}

function ClaudeGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.65 15.34l3.44-1.93.06-.17-.06-.09h-.17l-.59-.04-2.02-.06-1.75-.07-1.7-.09-.42-.09-.4-.52.04-.26.35-.24.5.04 1.12.08 1.68.12 1.22.07 1.8.19h.29l.04-.12-.1-.07-.08-.07-1.79-1.21-1.94-1.29-1.02-.74-.55-.37-.28-.36-.12-.77.5-.55.68.05.17.05.69.53 1.47 1.14 1.92 1.41.28.24.11-.08.02-.06-.13-.21-1.05-1.9-1.12-1.93-.5-.8-.13-.48c-.05-.2-.08-.36-.08-.56l.57-.77.31-.1.76.1.32.28.47 1.08.77 1.7 1.19 2.33.35.69.19.64.07.19h.12v-.11l.1-1.3.18-1.6.17-2.06.06-.58.28-.68.55-.36.43.21.36.51-.05.33-.21 1.38-.42 2.16-.27 1.45h.16l.18-.18.73-.97 1.22-1.53.54-.61.63-.67.4-.32h.77l.57.85-.26.87-.79 1-.66.85-.94 1.26-.59 1.01.05.08.14-.01 2.17-.46 1.17-.21 1.4-.24.63.29.07.3-.25.61-1.5.37-1.76.35-2.62.62-.03.02.04.05 1.18.11h.5l1.25.14.34.22.2.28-.03.21-.53.27-.72-.17-1.68-.4-.57-.14h-.08v.05l.48.47 2.19 1.98.28.4-.17.28-.32-.05-2.07-1.56-.8-.7-1.81-1.52h-.12v.16l.42.61 2.19 3.29.11 1.01-.16.33-.57.2-.62-.12-1.29-1.81-1.33-2.04-1.07-1.82-.13.08-.63 6.79-.3.35-.68.26-.57-.43-.3-.7.3-1.36.36-1.78.29-1.42.27-1.76.16-.58-.01-.04-.13.02-1.33 1.83-2.02 2.73-1.59 1.7-.39.15-.66-.34.06-.61.37-.55 2.2-2.8 1.32-1.73.86-1.01-.01-.14h-.05l-5.72 3.71-1.02.13-.44-.41.05-.67.21-.22 1.73-1.2z" />
    </svg>
  );
}
