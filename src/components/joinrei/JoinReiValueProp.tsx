import { useEffect, useRef, useState } from 'react';
import { ScrollFadeIn } from './ScrollFadeIn';
import { scrollToLastSection } from './scrollHelpers';
import { ChatFeedMockup } from './ChatFeedMockup';
import twitterVerifiedBadge from '@/assets/joinrei/twitter-verified-badge.png';
import agentVideo from '@/assets/joinrei/rei-on-X.webm.asset.json';

const TAB_DURATION = 8000;

type Tab = 'chatbot' | 'agent';

const Pill = ({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#181818] border border-primary/20">
    {icon}
    <span className="text-xs text-cream/80 font-mono">{children}</span>
  </div>
);

/** Video that plays forward, then reverses, indefinitely. */
const PingPongVideo = () => {
  const ref = useRef<HTMLVideoElement>(null);
  const reverseRef = useRef(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const step = () => {
      if (reverseRef.current && video.currentTime > 0.05) {
        video.currentTime = Math.max(0, video.currentTime - 1 / 30);
      } else if (reverseRef.current) {
        reverseRef.current = false;
        video.play().catch(() => {});
      }
      rafRef.current = requestAnimationFrame(step);
    };

    const onEnded = () => {
      reverseRef.current = true;
      video.pause();
    };

    video.addEventListener('ended', onEnded);
    video.play().catch(() => {});
    rafRef.current = requestAnimationFrame(step);

    return () => {
      video.removeEventListener('ended', onEnded);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <video
      ref={ref}
      src={agentVideo.url}
      muted
      playsInline
      autoPlay
      className="h-full w-full object-cover"
      aria-label="Rei AI agent posting on X"
    />
  );
};

export const JoinReiValueProp = () => {
  const [tab, setTab] = useState<Tab>('chatbot');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / TAB_DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) setTab((t) => (t === 'chatbot' ? 'agent' : 'chatbot'));
    }, 50);
    return () => clearInterval(interval);
  }, [tab]);

  return (
    <section className="min-h-screen snap-start relative flex items-center overflow-hidden bg-[#0f0f0f]">
      {/* Tabs */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <div className="flex border border-primary/25 rounded-sm overflow-hidden bg-[#141414]">
          {(['chatbot', 'agent'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-[11px] font-mono uppercase tracking-wider transition-colors ${
                tab === t ? 'bg-[#ed565a] text-[#181818]' : 'text-cream/60 hover:text-cream'
              }`}
            >
              {t === 'chatbot' ? 'Chatbot' : 'AI Agent'}
            </button>
          ))}
        </div>
        <div className="w-full h-[2px] bg-white/10 overflow-hidden rounded-full">
          <div className="h-full bg-[#ed565a] transition-none" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-0 items-center w-full pt-16">
        {/* Creative */}
        <div className="hidden lg:flex order-1 relative items-center justify-center px-12 py-16 h-screen">
          {tab === 'chatbot' ? (
            <div className="w-full max-w-[520px] animate-fade-in">
              <ChatFeedMockup />
            </div>
          ) : (
            <div className="w-full h-full animate-fade-in overflow-hidden rounded-2xl border-[0.5px] border-white/10">
              <PingPongVideo />
            </div>
          )}
        </div>

        {/* Copy */}
        <div className="space-y-6 order-2 px-8 lg:px-16">
          {tab === 'chatbot' ? (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary leading-[1.2]">
                AskRei Bounty Chatbot.
              </h2>

              <p className="text-sm md:text-base font-mono text-primary/70 leading-relaxed">
                Users simply chat with AskRei Chatbot and she finds appropriate bounties that match
                their skills. Projects can filter their bounties to be discovered only by users who
                have a certain Diamond Hand Score.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Pill
                  icon={
                    <>
                      <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <img src={twitterVerifiedBadge} alt="Verified" className="h-4 w-4 object-contain" />
                    </>
                  }
                >
                  Login
                </Pill>

                <Pill
                  icon={
                    <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 12l2 2 4-4" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                    </svg>
                  }
                >
                  Matches Skills to Campaigns
                </Pill>

                <Pill
                  icon={
                    <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                    </svg>
                  }
                >
                  Wallet Scanning
                </Pill>
              </div>

              <button className="btn-manga btn-manga-primary px-8 py-3 mt-4" onClick={scrollToLastSection}>
                Promote Task
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary leading-[1.2]">
                Your AI Agent KOL
              </h2>

              <p className="text-sm md:text-base font-mono text-primary/70 leading-relaxed">
                @AskRei_ is an Automated AI Agent that lives on X. When she finds your bounty on
                rei.chat she creates a post and promotes it on X. Rei's posts utilise our KOL network
                of 1 million+ reach on X.
              </p>

              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#ed565a]">Rei Posts</h3>
                <ul className="space-y-2.5">
                  {[
                    { label: 'Bounties & Deadline Reminders', d: 'M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z' },
                    { label: 'Bounty Tips & Earning Info', d: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
                    { label: 'Chart Analysis', d: 'M3 3v18h18M7 15l4-5 3 3 4-6' },
                    { label: 'Community Interaction', d: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
                  ].map((item) => (
                    <li key={item.label} className="flex items-center gap-3 text-xs md:text-sm font-mono text-primary/70">
                      <svg className="h-4 w-4 shrink-0 text-[#ed565a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.d} />
                      </svg>
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>

              <button className="btn-manga btn-manga-primary px-8 py-3 mt-4" onClick={scrollToLastSection}>
                Promote Task
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
