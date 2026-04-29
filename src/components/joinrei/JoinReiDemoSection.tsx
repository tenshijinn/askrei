import { useState, useEffect, useRef } from 'react';
import { ScrollFadeIn } from './ScrollFadeIn';
import { scrollToLastSection } from './scrollHelpers';
import twitterVerifiedBadge from '@/assets/joinrei/twitter-verified-badge.png';

// ---------- Hooks ----------

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
};

const useTypewriter = (text: string, active: boolean, speed = 35, startDelay = 0) => {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!active) {
      setOut(text);
      return;
    }
    setOut('');
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, active, speed, startDelay]);
  return out;
};

// ---------- Sub-components ----------

const OnboardingMockup = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const [step, setStep] = useState(reduced ? 3 : 1);
  const [xSigned, setXSigned] = useState(reduced);
  const [walletConnected, setWalletConnected] = useState(reduced);
  const [activeRoles, setActiveRoles] = useState<number>(reduced ? 3 : 0);

  useEffect(() => {
    if (!active || reduced) return;
    setStep(1);
    setXSigned(false);
    setWalletConnected(false);
    setActiveRoles(0);

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    timeouts.push(setTimeout(() => setXSigned(true), 1200));
    timeouts.push(setTimeout(() => setStep(2), 2200));
    timeouts.push(setTimeout(() => setWalletConnected(true), 3400));
    timeouts.push(setTimeout(() => setStep(3), 4400));
    timeouts.push(setTimeout(() => setActiveRoles(1), 5200));
    timeouts.push(setTimeout(() => setActiveRoles(2), 5900));
    timeouts.push(setTimeout(() => setActiveRoles(3), 6600));

    const loop = setInterval(() => {
      setStep(1);
      setXSigned(false);
      setWalletConnected(false);
      setActiveRoles(0);
      setTimeout(() => setXSigned(true), 1200);
      setTimeout(() => setStep(2), 2200);
      setTimeout(() => setWalletConnected(true), 3400);
      setTimeout(() => setStep(3), 4400);
      setTimeout(() => setActiveRoles(1), 5200);
      setTimeout(() => setActiveRoles(2), 5900);
      setTimeout(() => setActiveRoles(3), 6600);
    }, 10000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, [active, reduced]);

  const roles = ['Dev', 'Design', 'Community', 'Research'];

  return (
    <div className="w-full aspect-[552/816] rounded-2xl overflow-hidden border-[0.5px] border-white/10 bg-[#111]">
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <span className="text-[10px] text-cream/40 font-mono">rei.app/onboarding</span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
          </div>
        </div>
        <div className="flex-1 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 justify-center">
            {[1, 2, 3].map((n, idx) => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${
                  step >= n ? 'bg-[#ed565a] text-white scale-110' : 'bg-white/10 text-cream/40'
                }`}>{n}</div>
                {idx < 2 && <div className={`w-8 h-[1px] transition-colors duration-500 ${step > n ? 'bg-[#ed565a]/60' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>

          <h4 className="text-sm font-light text-primary text-center mt-2">Verify Your Identity</h4>

          <button className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#181818] border transition-all duration-300 ${
            xSigned ? 'border-green-500/50' : 'border-primary/20'
          }`}>
            <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <img src={twitterVerifiedBadge} alt="Verified" className="h-4 w-4 object-contain" />
            <span className="text-xs text-cream/80 font-mono">Sign in with X</span>
            {xSigned && (
              <svg className="h-3.5 w-3.5 text-green-400 animate-fade-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <button className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#181818] border transition-all duration-300 ${
            walletConnected ? 'border-green-500/50' : 'border-primary/20'
          }`}>
            <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="6" width="20" height="14" rx="2" />
              <path d="M22 10H2" />
              <circle cx="18" cy="14" r="1.5" />
            </svg>
            <span className="text-xs text-cream/80 font-mono">
              {walletConnected ? '7xKn…9pQ2' : 'Connect Wallet'}
            </span>
            {walletConnected && (
              <svg className="h-3.5 w-3.5 text-green-400 animate-fade-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <div className="mt-auto">
            <span className="text-[10px] text-cream/40 font-mono mb-2 block">Select Roles</span>
            <div className="flex flex-wrap gap-1.5">
              {roles.map((role, i) => {
                const on = i < activeRoles;
                return (
                  <span
                    key={role}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all duration-300 ${
                      on ? 'bg-[#ed565a]/20 border border-[#ed565a]/40 text-[#ed565a] scale-105' : 'bg-white/5 border border-white/10 text-cream/50'
                    }`}
                  >
                    {role}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            <div className="w-3 h-3 rounded-full bg-[#ed565a] animate-pulse" />
            <div className="flex items-end gap-0.5 h-3 flex-1">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((b) => (
                <div
                  key={b}
                  className="w-0.5 bg-[#ed565a]/60 rounded-full animate-pulse"
                  style={{
                    height: `${30 + ((b * 17) % 70)}%`,
                    animationDelay: `${b * 100}ms`,
                    animationDuration: '900ms',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] text-cream/50 font-mono">30s intro</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatMockup = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const [phase, setPhase] = useState(reduced ? 7 : 0);

  useEffect(() => {
    if (!active || reduced) return;
    setPhase(0);
    const schedule = [800, 1700, 2400, 3400, 4500, 5400, 6800];
    const timeouts = schedule.map((t, i) => setTimeout(() => setPhase(i + 1), t));
    const loop = setInterval(() => {
      setPhase(0);
      schedule.forEach((t, i) => setTimeout(() => setPhase(i + 1), t));
    }, 11000);
    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, [active, reduced]);

  const TypingDots = () => (
    <div className="flex gap-1 items-center px-2 py-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-cream/50 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </div>
  );

  return (
    <div className="w-full aspect-[552/816] rounded-2xl overflow-hidden border-[0.5px] border-white/10 bg-[#111]">
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <span className="text-[10px] text-cream/40 font-mono">rei://chat</span>
          <div className="flex gap-1.5">
            <span className="text-[9px] px-2 py-0.5 rounded bg-[#ed565a]/20 text-[#ed565a] font-mono">Talent</span>
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
          {phase === 0 && <TypingDots />}

          {phase >= 1 && (
            <div className="flex items-start gap-2 animate-fade-in">
              <span className="shrink-0 text-[9px] px-2 py-0.5 rounded bg-[#ed565a]/20 text-[#ed565a] font-mono border border-[#ed565a]/30">Rei</span>
              <p className="text-[11px] text-cream/80 font-mono leading-relaxed text-left">Hey! I found 3 tasks matching your skills in Community & Design.</p>
            </div>
          )}

          {phase >= 2 && (
            <div className="space-y-2 ml-2">
              <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cream/70 font-mono">Galxe Quest</span>
                  <span className="text-[9px] text-green-400/70 font-mono">0.5 SOL</span>
                </div>
                <p className="text-[9px] text-cream/40 font-mono mt-0.5 text-left">Community activation campaign</p>
              </div>
              {phase >= 3 && (
                <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cream/70 font-mono">QuestN Bounty</span>
                    <span className="text-[9px] text-green-400/70 font-mono">1.2 SOL</span>
                  </div>
                  <p className="text-[9px] text-cream/40 font-mono mt-0.5 text-left">Design social media assets</p>
                </div>
              )}
            </div>
          )}

          {phase >= 4 && (
            <div className="flex items-start gap-2 justify-end animate-fade-in">
              <p className="text-[11px] text-blue-300 font-mono leading-relaxed text-right">Show me the Galxe quest details</p>
              <span className="shrink-0 text-[9px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">You</span>
            </div>
          )}

          {phase === 5 && <TypingDots />}

          {phase >= 6 && (
            <div className="flex items-start gap-2 animate-fade-in">
              <span className="shrink-0 text-[9px] px-2 py-0.5 rounded bg-[#ed565a]/20 text-[#ed565a] font-mono border border-[#ed565a]/30">Rei</span>
              <p className="text-[11px] text-cream/80 font-mono leading-relaxed text-left">Sure! Here's the breakdown...</p>
            </div>
          )}

          {phase >= 7 && (
            <div className="flex items-start gap-2 animate-fade-in">
              <span className="shrink-0 text-[9px] px-2 py-0.5 rounded bg-[#ed565a]/20 text-[#ed565a] font-mono border border-[#ed565a]/30">Rei</span>
              <div className="px-2.5 py-1.5 rounded-lg bg-[#ed565a]/10 border border-[#ed565a]/30">
                <p className="text-[10px] text-[#ed565a] font-mono leading-relaxed text-left underline">galxe.com/quest/dao-activation</p>
                <p className="text-[9px] text-green-400/80 font-mono mt-0.5 text-left">0.5 SOL + 250 XP</p>
              </div>
            </div>
          )}

          <div className="mt-auto flex flex-wrap gap-1.5">
            {['Find Tasks', 'My Points', 'Earnings'].map((action) => (
              <span key={action} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] text-cream/50 font-mono">
                {action}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] text-gray-500 font-mono flex-1 text-left">
              Ask Rei anything<span className="animate-pulse">▌</span>
            </span>
            <div className="w-5 h-5 rounded bg-[#ed565a]/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-[#ed565a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostTaskMockup = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const types = ['Job', 'Task', 'Bounty', 'Quest'];
  const [typeIdx, setTypeIdx] = useState(reduced ? 2 : 0);
  const [showFields, setShowFields] = useState(reduced);
  const [tagCount, setTagCount] = useState(reduced ? 2 : 0);
  const [posted, setPosted] = useState(false);

  const title = useTypewriter('Community Bounty Q2', active && showFields && !reduced, 50, 0);
  const company = useTypewriter('Phantom Wallet', active && showFields && !reduced, 55, 800);
  const description = useTypewriter('Create social media content for our community growth campaign...', active && showFields && !reduced, 25, 1700);
  const compensation = useTypewriter('2.5 SOL', active && showFields && !reduced, 70, 4200);

  useEffect(() => {
    if (!active || reduced) return;
    let cycleTimers: ReturnType<typeof setTimeout>[] = [];

    const runCycle = () => {
      setTypeIdx(0);
      setShowFields(false);
      setTagCount(0);
      setPosted(false);

      cycleTimers.push(setTimeout(() => setTypeIdx(1), 500));
      cycleTimers.push(setTimeout(() => setTypeIdx(2), 1000));
      cycleTimers.push(setTimeout(() => setShowFields(true), 1300));
      cycleTimers.push(setTimeout(() => setTagCount(1), 5400));
      cycleTimers.push(setTimeout(() => setTagCount(2), 5900));
      cycleTimers.push(setTimeout(() => setPosted(true), 7200));
    };

    runCycle();
    const loop = setInterval(() => {
      cycleTimers.forEach(clearTimeout);
      cycleTimers = [];
      runCycle();
    }, 11000);

    return () => {
      cycleTimers.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, [active, reduced]);

  const Caret = () => <span className="animate-pulse">▌</span>;
  const tags = ['Community', 'Content', 'Designer'];

  return (
    <div className="w-full aspect-[552/816] rounded-2xl overflow-hidden border-[0.5px] border-white/10 bg-[#111]">
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <span className="text-[10px] text-cream/40 font-mono">rei://post-task</span>
          <div className="flex gap-1.5">
            <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">Employer</span>
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
          <div>
            <span className="text-[10px] text-cream/40 font-mono mb-1.5 block text-left">Type</span>
            <div className="flex flex-wrap gap-1">
              {types.map((type, i) => (
                <span
                  key={type}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono transition-all duration-300 ${
                    i === typeIdx ? 'bg-[#ed565a]/20 border border-[#ed565a]/40 text-[#ed565a] scale-105' : 'bg-white/5 border border-white/10 text-cream/50'
                  }`}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] text-cream/40 font-mono mb-1 block text-left">Title</span>
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] text-cream/60 font-mono text-left block min-h-[1em]">
                  {title}{showFields && !reduced && title.length < 'Community Bounty Q2'.length && <Caret />}
                </span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-cream/40 font-mono mb-1 block text-left">Company</span>
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] text-cream/60 font-mono text-left block min-h-[1em]">
                  {company}{showFields && !reduced && company.length > 0 && company.length < 'Phantom Wallet'.length && <Caret />}
                </span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-cream/40 font-mono mb-1 block text-left">Description</span>
              <div className="px-3 py-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] text-cream/60 font-mono leading-relaxed text-left block min-h-[1em]">
                  {description}{showFields && !reduced && description.length > 0 && description.length < 'Create social media content for our community growth campaign...'.length && <Caret />}
                </span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-cream/40 font-mono mb-1 block text-left">Compensation</span>
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] text-cream/60 font-mono text-left block min-h-[1em]">
                  {compensation}{showFields && !reduced && compensation.length > 0 && compensation.length < '2.5 SOL'.length && <Caret />}
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-cream/40 font-mono mb-1.5 block text-left">Role Tags</span>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag, i) => {
                const on = i < tagCount;
                return (
                  <span
                    key={tag}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono transition-all duration-300 ${
                      on ? 'bg-[#ed565a]/20 border border-[#ed565a]/40 text-[#ed565a] scale-105' : 'bg-white/5 border border-white/10 text-cream/50'
                    }`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-auto">
            <button className={`w-full py-2 rounded-lg text-[11px] font-mono font-medium transition-all duration-300 ${
              posted ? 'bg-green-500 text-white' : 'bg-[#ed565a] text-white animate-pulse'
            }`}>
              {posted ? 'Posted ✓' : 'Pay 5 USDC & Post'}
            </button>
            <p className="text-[8px] text-cream/30 font-mono text-center mt-1.5">Solana Pay • x402</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Main section ----------

export const JoinReiDemoSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20"
    >
      <div className="container mx-auto px-8 lg:px-16">
        <div className="grid md:grid-cols-3 gap-16 lg:gap-20 max-w-6xl mx-auto">
          <ScrollFadeIn delay={0}>
            <div className="flex flex-col items-center text-center">
              <h3 className="text-sm md:text-base lg:text-lg font-light text-primary mb-4 tracking-wide whitespace-nowrap">
                PROOF OF HUMANITY/TALENT
              </h3>
              <OnboardingMockup active={isActive} reduced={reduced} />
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn delay={150}>
            <div className="flex flex-col items-center text-center">
              <h3 className="text-sm md:text-base lg:text-lg font-light text-primary mb-4 tracking-wide whitespace-nowrap">
                FIND TASKS MATCHED TO SKILLS
              </h3>
              <ChatMockup active={isActive} reduced={reduced} />
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn delay={300}>
            <div className="flex flex-col items-center text-center">
              <h3 className="text-sm md:text-base lg:text-lg font-light text-primary mb-4 tracking-wide whitespace-nowrap">
                POST TASKS | CHATBOT OR X
              </h3>
              <PostTaskMockup active={isActive} reduced={reduced} />
            </div>
          </ScrollFadeIn>
        </div>

        <ScrollFadeIn delay={500}>
          <div className="flex justify-center mt-8">
            <button
              className="btn-manga btn-manga-primary px-8 py-3"
              onClick={() => window.location.href = '/rei'}
            >
              Promote Task
            </button>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
