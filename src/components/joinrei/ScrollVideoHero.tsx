import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import reiLogo from '@/assets/joinrei/rei-logo.png';
import reiHero from '@/assets/joinrei/rei-hero.png';
import colosseumLogo from '@/assets/joinrei/colosseum-logo.png';
import twitterVerifiedBadge from '@/assets/joinrei/twitter-verified-badge.png';
import arubaito from '@/assets/joinrei/logo-bar-arubaito.png';
import ignyte from '@/assets/joinrei/logo-bar-ignyte.png';
import solanaFoundation from '@/assets/joinrei/logo-bar-solana-foundation.png';
import colossium from '@/assets/joinrei/logo-bar-colossium.png';

const SCROLL_FRAME_COUNT = 60;
const getScrollFrameSrc = (index: number) =>
  `/scroll-rei-frames/frame-${String(index + 1).padStart(3, '0')}.jpg`;

const BOUNTY_COUNT_KEY = 'rei_bounty_count_v1';
const BOUNTY_COUNT_TTL = 4 * 60 * 60 * 1000; // 4h

const useBountyCount = () => {
  const [count, setCount] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(BOUNTY_COUNT_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (Date.now() - p.t > BOUNTY_COUNT_TTL) return p.c ?? null;
      return p.c;
    } catch { return null; }
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BOUNTY_COUNT_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (Date.now() - p.t < BOUNTY_COUNT_TTL) return;
      }
    } catch {}
    supabase.from('tasks').select('*', { count: 'exact', head: true }).then(({ count: c }) => {
      if (typeof c === 'number') {
        setCount(c);
        try { localStorage.setItem(BOUNTY_COUNT_KEY, JSON.stringify({ c, t: Date.now() })); } catch {}
      }
    });
  }, []);
  return count;
};

const BountyCountPill = () => {
  const count = useBountyCount();
  const num = (count ?? 0).toLocaleString();
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-transparent border border-cream/30">
      <span className="text-base md:text-lg font-mono text-[#ed565a] font-semibold">{num}</span>
      <span className="text-base md:text-lg font-mono text-[#ed565a] font-semibold">bounties</span>
      <span className="text-base md:text-lg font-mono text-cream/70">delivered to date.</span>
    </div>
  );
};

const ROTATOR_WORDS = ['bounties', 'quests', 'tasks', 'airdrops'];

const RotatorText = ({ words, interval = 2000 }: { words: string[]; interval?: number }) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);
  return (
    <span className="inline-block text-[#ed565a] font-semibold transition-opacity duration-300">
      {words[index]}
    </span>
  );
};



const SimplePill = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181818] border border-primary/20">
    <span className="text-xs text-cream/80 font-mono">{label}</span>
  </div>
);

const VerifiedLoginPill = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181818] border border-primary/20">
    <svg className="h-3.5 w-3.5 text-cream" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
    <img src={twitterVerifiedBadge} alt="" className="h-3.5 w-3.5 object-contain" />
    <span className="text-xs text-cream/80 font-mono">Verified Login</span>
  </div>
);

const MatchesSkillsPill = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181818] border border-primary/20">
    <svg className="h-3.5 w-3.5 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
    <span className="text-xs text-cream/80 font-mono">Matched to You</span>
  </div>
);

const ProofOfTalentPill = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181818] border border-primary/20">
    <svg className="h-3.5 w-3.5 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l2.39 4.84L20 7.74l-4 3.9.94 5.5L12 14.77 7.06 17.14 8 11.64l-4-3.9 5.61-.9z" />
    </svg>
    <span className="text-xs text-cream/80 font-mono">Proof-of-Talent</span>
  </div>
);

const MiniFrame = ({
  title,
  children,
  extra,
}: {
  title: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) => (
  <div className="rounded-xl border-[0.5px] border-white/10 p-4 bg-[#141414]/60 backdrop-blur-sm">
    <h3 className="text-sm md:text-base font-light text-primary leading-tight mb-1">{title}</h3>
    <p className="text-[11px] md:text-xs font-mono text-primary/70 leading-relaxed">{children}</p>
    {extra && <div className="mt-2 flex flex-wrap gap-2">{extra}</div>}
  </div>
);

export const ScrollVideoHero = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const [frameIndex, setFrameIndex] = useState(0);

  // Scrub through exported video frames. Chromium can stall on currentTime
  // scrubbing, while frame images stay perfectly tied to scroll progress.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const scroller = getScrollParent(section);

    const tick = () => {
      rafRef.current = null;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;
      const nextFrame = Math.min(
        SCROLL_FRAME_COUNT - 1,
        Math.max(0, Math.round(progress * (SCROLL_FRAME_COUNT - 1)))
      );
      if (nextFrame !== frameRef.current) {
        frameRef.current = nextFrame;
        setFrameIndex(nextFrame);
      }
    };

    const onScroll = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };

    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      scroller.removeEventListener('scroll', onScroll as EventListener);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const preloadWindow = 8;
    for (let i = 1; i <= preloadWindow; i += 1) {
      const next = Math.min(SCROLL_FRAME_COUNT - 1, frameIndex + i);
      const img = new Image();
      img.src = getScrollFrameSrc(next);
    }
  }, [frameIndex]);

  return (
    <section ref={sectionRef} className="relative bg-[#0a0a0a]" style={{ height: '300vh' }}>
      {/* snap markers — one per parallax stage */}
      <div className="absolute left-0 w-px h-px snap-start pointer-events-none" style={{ top: 0 }} />
      <div className="absolute left-0 w-px h-px snap-start pointer-events-none" style={{ top: '100vh' }} />
      <div className="absolute left-0 w-px h-px snap-start pointer-events-none" style={{ top: '200vh' }} />

      <div className="sticky top-0 h-screen w-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* LEFT — track that translates with scroll */}
        <div className="relative h-screen overflow-hidden">
          <div className="absolute inset-0 will-change-transform" id="scroll-left-track">
            <LeftPanelTrack />
          </div>
        </div>

        {/* RIGHT — sticky scrubbing video */}
        <div className="relative h-screen bg-black hidden lg:block">
          <img
            src={getScrollFrameSrc(frameIndex)}
            alt="Rei scroll animation"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 z-30 bg-[#0a0a0a] p-2">
            <img src={reiLogo} alt="Rei AI" className="h-12 lg:h-16 w-auto block" />
          </div>
          <div className="absolute bottom-6 right-6 z-20">
            <a
              href="https://arena.colosseum.org/projects/explore/rei"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={colosseumLogo}
                alt="Colosseum"
                className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
        </div>
      </div>

      <LeftTrackController sectionRef={sectionRef} />
    </section>
  );
};

const getScrollParent = (el: HTMLElement): HTMLElement | Window => {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(style.overflowY)) return node;
    node = node.parentElement;
  }
  return window;
};



const LeftPanelTrack = () => (
  <div className="flex flex-col text-primary">
    {/* Block 1: Hero — top content, bottom buttons (matches / home) */}
    <div className="h-screen w-full flex flex-col justify-between p-6 sm:p-8 lg:p-12 xl:p-16">
      {/* DESKTOP (lg+) — original layout */}
      <div className="hidden lg:block pt-2">
        <BountyCountPill />
        <h1 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary leading-[1.15] tracking-tight">
          Spend Less time Searching
          <br />
          Spend More time Earning
          <br />
          A 1000 Bounties in your Chat
        </h1>
        <p className="mt-6 text-sm md:text-base text-primary/70 font-mono leading-relaxed whitespace-pre-line">
          <strong className="text-primary font-semibold">Stop</strong> wasting hours searching for crypto opportunities.{"\n"}
          <strong className="text-primary font-semibold">No more</strong> jumping between Telegram, X and quest platforms.{"\n"}
          <strong className="text-primary font-semibold">Rei</strong> finds and organizes <RotatorText words={ROTATOR_WORDS} /> in <strong className="text-primary font-semibold">one AI-powered feed and Agent</strong>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <SimplePill label="Early Discovery" />
          <SimplePill label="Consistent Profits" />
          <SimplePill label="Save Hours" />
          <SimplePill label="No More FOMO" />
          <SimplePill label="Stay Ahead" />
        </div>
      </div>

      {/* MOBILE / TABLET — stacked layout matching template */}
      <div className="lg:hidden flex-1 min-h-0 flex flex-col gap-3 sm:gap-4">
        {/* Top header: logo left, How it works right */}
        <div className="flex items-center justify-between shrink-0">
          <img src={reiLogo} alt="Rei AI" className="h-8 w-auto object-contain" />
          <button
            className="text-xs font-mono text-cream/80 hover:text-cream transition-colors"
            onClick={() => {
              const scroller = document.querySelector('.snap-y') as HTMLElement | null;
              const target = (scroller?.clientHeight ?? window.innerHeight) * 2;
              (scroller ?? window).scrollBy({ top: target, behavior: 'smooth' });
            }}
          >
            How it works
          </button>
        </div>
        <div className="shrink-0">
          <BountyCountPill />
        </div>
        <h1 className="text-[1.5rem] sm:text-[1.75rem] font-light text-primary leading-[1.05] tracking-tight shrink-0">
          Spend Less time Searching
          <br />
          Spend More time Earning
          <br />
          A 1000 Bounties in your Chat
        </h1>
        <p className="text-[11px] sm:text-[13px] text-primary/70 font-mono leading-relaxed whitespace-normal shrink-0">
          <strong className="text-primary font-semibold">Stop</strong> wasting hours searching for crypto opportunities. <strong className="text-primary font-semibold">No more</strong> jumping between Telegram, X and quest platforms. <strong className="text-primary font-semibold">Rei</strong> finds and organizes <RotatorText words={ROTATOR_WORDS} /> in <strong className="text-primary font-semibold">one AI-powered feed and Agent</strong>.
        </p>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#181818] border border-primary/20 text-[10px] text-cream/80 font-mono whitespace-nowrap">
            Consistent Profits
          </span>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#181818] border border-primary/20 text-[10px] text-cream/80 font-mono whitespace-nowrap">
            Save Hours
          </span>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#181818] border border-primary/20 text-[10px] text-cream/80 font-mono whitespace-nowrap">
            No More FOMO
          </span>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            className="btn-manga w-full"
            style={{ backgroundColor: '#ed565a', borderColor: '#ed565a', color: '#181818' }}
            onClick={() => (window.location.href = '/rei')}
          >
            Start Now
          </button>
        </div>
        <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-primary/15">
          <img
            src={reiHero}
            alt="Rei AI Agent"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-4 sm:gap-6 flex-wrap pt-4 lg:pt-0">
        <button
          className="btn-manga"
          style={{ backgroundColor: '#ed565a', borderColor: '#ed565a', color: '#181818' }}
          onClick={() => (window.location.href = '/rei')}
        >
          Start Now
        </button>
        <button
          className="btn-manga btn-manga-outline"
          onClick={() => {
            const scroller = document.querySelector('.snap-y') as HTMLElement | null;
            const target = (scroller?.clientHeight ?? window.innerHeight) * 2;
            (scroller ?? window).scrollBy({ top: target, behavior: 'smooth' });
          }}
        >
          How it Works
        </button>
      </div>
    </div>

    {/* Block 2: Logo bar — centered */}
    <div className="h-screen w-full flex flex-col justify-center items-center px-8 lg:px-12 xl:px-16">
      <h2 className="text-xs font-mono text-primary/50 tracking-widest uppercase mb-10 text-center">
        Backed by
      </h2>
      <div className="flex flex-col gap-10 items-center justify-center w-full">
        <a href="https://arubaito.app" target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100 transition-opacity">
          <img src={arubaito} alt="Arubaito" className="h-12 lg:h-14 w-auto object-contain" />
        </a>
        <img src={ignyte} alt="IGNYTE - 1 of 15 / 3000" className="h-12 lg:h-14 w-auto object-contain opacity-90" />
        <img src={solanaFoundation} alt="Solana Foundation" className="h-12 lg:h-14 w-auto object-contain opacity-90" />
        <a href="https://arena.colosseum.org/projects/explore/rei" target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100 transition-opacity">
          <img src={colossium} alt="Colosseum Frontier" className="h-12 lg:h-14 w-auto object-contain" />
        </a>
      </div>
    </div>

    {/* Block 3: How it works — centered */}
    <div className="h-screen w-full flex flex-col justify-center items-center px-8 lg:px-12 xl:px-16">
      <h2 className="text-[1.5rem] md:text-[1.75rem] lg:text-[2rem] font-light text-primary leading-tight mb-4 text-center">
        How it works
      </h2>
      <div className="flex flex-col gap-2.5 w-full max-w-md mx-auto">
        <MiniFrame
          title="One feed. Every platform."
          extra={
            <>
              <SimplePill label="Galxe" />
              <SimplePill label="Zealy" />
              <SimplePill label="TaskOn" />
              <SimplePill label="Earn" />
            </>
          }
        >
          Stop tab-hopping across quest platforms. Rei aggregates live bounties into one matched feed.
        </MiniFrame>
        <MiniFrame title="Tasks that fit your skills." extra={<MatchesSkillsPill />}>
          SkillSync surfaces bounties matched to your wallet history and on-chain track record — not random noise.
        </MiniFrame>
        <MiniFrame
          title="Get verified, get prioritised."
          extra={
            <>
              <VerifiedLoginPill />
              <ProofOfTalentPill />
            </>
          }
        >
          Verified X + 60s voice intro gives you a proof-of-talent score, so projects see{' '}
          <strong className="text-cream font-semibold">you, not the farmers</strong>.
        </MiniFrame>
        <MiniFrame title="Find Highest Paying Bounties">
          Time is money. Rei filters for highest paying rewards automatically.
        </MiniFrame>
      </div>
      <button
        className="btn-manga btn-manga-primary px-6 py-2 mt-4"
        onClick={() => (window.location.href = '/rei')}
      >
        Signup
      </button>
    </div>
  </div>

);

const LeftTrackController = ({ sectionRef }: { sectionRef: React.RefObject<HTMLDivElement> }) => {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const track = section.querySelector<HTMLDivElement>('#scroll-left-track');
    if (!track) return;
    const scroller = getScrollParent(section);

    let raf: number | null = null;
    const update = () => {
      raf = null;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;
      const offset = progress * (2 * vh);
      track.style.transform = `translate3d(0, ${-offset}px, 0)`;
    };
    const onScroll = () => {
      if (raf == null) raf = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      scroller.removeEventListener('scroll', onScroll as EventListener);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sectionRef]);
  return null;
};

