import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollFadeIn } from './ScrollFadeIn';
import reiLogo from '@/assets/joinrei/rei-logo.png';
import reiHero from '@/assets/joinrei/rei-hero.png';
import twitterVerifiedBadge from '@/assets/joinrei/twitter-verified-badge.png';
import arubaito from '@/assets/joinrei/logo-bar-arubaito.png';
import ignyte from '@/assets/joinrei/logo-bar-ignyte.png';
import solanaFoundation from '@/assets/joinrei/logo-bar-solana-foundation.png';
import colossium from '@/assets/joinrei/logo-bar-colossium.png';
import solanaX402Asset from '@/assets/joinrei/logo-bar-solana-x402.png.asset.json';
import nousHermesAsset from '@/assets/joinrei/logo-bar-nous-hermes.png.asset.json';
import txSolAsset from '@/assets/joinrei/tx-sol.png.asset.json';
import txUsdgAsset from '@/assets/joinrei/tx-usdg.png.asset.json';
import txUsdcAsset from '@/assets/joinrei/tx-usdc.png.asset.json';
import platZealy from '@/assets/joinrei/logo-plat-zealy.png.asset.json';
import platTaskon from '@/assets/joinrei/logo-plat-taskon.png.asset.json';
import platGalxe from '@/assets/joinrei/logo-plat-galxe.png.asset.json';
import platScribble from '@/assets/joinrei/logo-plat-scribble.png.asset.json';
import platSuperteam from '@/assets/joinrei/logo-plat-superteam-earn.png.asset.json';

const PLATFORM_LOGOS = [
  { src: platZealy.url, alt: 'Zealy' },
  { src: platTaskon.url, alt: 'TaskOn' },
  { src: platGalxe.url, alt: 'Galxe' },
  { src: platScribble.url, alt: 'Scribble' },
  { src: platSuperteam.url, alt: 'Superteam Earn' },
];

const HeroPill = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent border border-white/20">
    <span className="text-xs text-white/50 font-mono">{label}</span>
  </div>
);

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

// Rough USD estimates just for ranking "biggest bounty in the latest batch".
const USD_RANK: Record<string, number> = {
  USD: 1, USDC: 1, USDT: 1, USDG: 1, DAI: 1, PYUSD: 1, BUSD: 1, FDUSD: 1, USDP: 1,
  SOL: 150, ETH: 3000, BTC: 60000, BNB: 500, MATIC: 0.7, POL: 0.7,
  ARB: 1, OP: 2, SUI: 1, APT: 8, AVAX: 30, JUP: 0.8, JTO: 3, PYTH: 0.4,
};

// Returns display string + a rough USD estimate for ranking.
const parseLatestBountyAmount = (
  comp: string | null | undefined,
): { display: string; usd: number } | null => {
  if (!comp) return null;
  const s = comp.trim();
  // Dollar / fiat, e.g. "$1,800", "$1.5K", "$2M"
  const dm = s.match(/^\$\s?([\d,]+(?:\.\d+)?)\s?([KkMm])?/);
  if (dm) {
    let n = Number(dm[1].replace(/,/g, ''));
    if (!isFinite(n)) return null;
    const suf = dm[2]?.toUpperCase();
    if (suf === 'M') n *= 1_000_000;
    if (suf === 'K') n *= 1_000;
    return { display: `$${formatNumber(n)}`, usd: n };
  }
  // Amount + token, e.g. "1 USDC", "5,000 USDG", "10 EVM", "0.5 SOL"
  const cm = s.match(/^([\d,]+(?:\.\d+)?)\s+\$?([A-Za-z][A-Za-z0-9]{1,15})/);
  if (cm) {
    const n = Number(cm[1].replace(/,/g, ''));
    if (!isFinite(n)) return null;
    const sym = cm[2].toUpperCase();
    const rate = USD_RANK[sym] ?? 0;
    return { display: `${formatNumber(n)} $${sym}`, usd: n * rate };
  }
  return { display: s, usd: 0 };
};


const formatRelativeTime = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(diffMs / 60000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min}min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}hr ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
};

const useLatestBounty = () => {
  const [state, setState] = useState<{ amount: string; createdAt: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from('v_public_tasks')
        .select('compensation, created_at')
        .not('compensation', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);
      if (cancelled || !data || data.length === 0) return;

      // Newest batch = rows sharing the max created_at timestamp.
      const newest = data[0].created_at;
      const batch = data.filter((r) => r.created_at === newest);

      let best: { display: string; usd: number } | null = null;
      let fallback: { display: string; usd: number } | null = null;
      for (const row of batch) {
        const v = parseLatestBountyAmount(row.compensation);
        if (!v) continue;
        if (!fallback) fallback = v;
        if (v.usd > 0 && (!best || v.usd > best.usd)) best = v;
      }
      const pick = best ?? fallback;
      if (pick && newest) setState({ amount: pick.display, createdAt: newest });
    };
    load();
    const id = setInterval(load, 60 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  return state;
};

const LatestBountyCard = () => {
  const data = useLatestBounty();
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((v) => v + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border-[0.5px] border-white/10 bg-[#141414]/60 backdrop-blur-sm px-5 py-3 min-w-[180px] flex flex-col justify-between">
      <div>
        <p className="text-[10px] font-mono text-white/40 tracking-wider mb-1">Latest Bounty</p>
        <p className="text-2xl font-light text-white/70 tabular-nums whitespace-nowrap">{data?.amount ?? '—'}</p>
      </div>
      <p className="text-[10px] font-mono text-white/30 mt-2">
        {data ? `synced ${formatRelativeTime(data.createdAt)}` : ''}
      </p>
    </div>
  );
};

const PlatformTicker = () => {
  const [paused, setPaused] = useState(false);
  return (
    <div
      className="rounded-xl border-[0.5px] border-white/10 bg-[#141414]/60 backdrop-blur-sm px-5 py-3 flex-1 min-w-0 overflow-hidden flex flex-col justify-start"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="text-[10px] font-mono text-white/40 tracking-wider mb-2">Bounty Platforms Aggregated</p>
      <div className="hero-ticker-viewport">
        <div className="hero-ticker-track" style={{ animationPlayState: paused ? 'paused' : 'running' }}>
          {[...PLATFORM_LOGOS, ...PLATFORM_LOGOS].map((l, i) => (
            <img key={i} src={l.src} alt={l.alt} className="h-10 w-auto object-contain opacity-60 shrink-0" />
          ))}
        </div>
      </div>
      <style>{`
        .hero-ticker-viewport { overflow: hidden; width: 100%; }
        .hero-ticker-track {
          display: flex; align-items: center; gap: 3rem; width: max-content;
          animation: hero-ticker 40s linear infinite;
        }
        @keyframes hero-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};




const SCROLL_FRAME_COUNT = 60;
const getScrollFrameSrc = (index: number) =>
  `/scroll-rei-frames/frame-${String(index + 1).padStart(3, '0')}.jpg`;

const useBountyCount = () => {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    // Clear any stale cache from a previous version
    try { localStorage.removeItem('rei_bounty_count_v1'); } catch {}
    supabase.from('platform_stats').select('lifetime_bounties').eq('id', 'global').maybeSingle()
      .then(({ data }) => {
        const c = data?.lifetime_bounties;
        if (typeof c === 'number') setCount(c);
      });
  }, []);
  return count;
};

const useBountyValueUsd = () => {
  const [usd, setUsd] = useState<number | null>(null);
  useEffect(() => {
    supabase.from('platform_stats').select('lifetime_value_usd').eq('id', 'global').maybeSingle()
      .then(({ data }) => {
        if (data?.lifetime_value_usd != null) setUsd(Number(data.lifetime_value_usd));
      });
  }, []);
  return usd;
};


const formatUsd = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

const CombinedSocialProofPill = () => {
  const count = useBountyCount();
  const usd = useBountyValueUsd();
  const num = (count ?? 0).toLocaleString();
  const value = usd && usd > 0 ? formatUsd(usd) : null;
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-transparent border border-cream/30">
      <span className="text-base md:text-lg font-mono text-[#ed565a] font-semibold">{num}</span>
      <span className="text-base md:text-lg font-mono text-[#ed565a] font-semibold">bounties</span>
      <span className="text-base md:text-lg font-mono text-cream/70">aggregated worth</span>
      {value ? (
        <span className="text-base md:text-lg font-mono text-[#ed565a] font-semibold">{value}+</span>
      ) : null}
    </div>
  );
};

const ROTATOR_WORDS = ['Bounties', 'Quests', 'Tasks', 'Airdrops'];

const TX_ITEMS = [
  { src: txSolAsset.url, alt: '+5.5 SOL received', threshold: 0 },
  { src: txUsdgAsset.url, alt: '+3120 USDG received', threshold: 16 },
  { src: txUsdcAsset.url, alt: '+1847 USDC received', threshold: 40 },
];

const TxStack = ({ frameIndex }: { frameIndex: number }) => (
  <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-1.5 w-[min(320px,38%)] pointer-events-none">
    {TX_ITEMS.map((tx, i) => {
      const visible = frameIndex >= tx.threshold;
      return (
        <img
          key={i}
          src={tx.src}
          alt={tx.alt}
          className="w-full h-auto drop-shadow-2xl"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 500ms ease-out, transform 500ms ease-out',
          }}
        />
      );
    })}
  </div>
);


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
          <TxStack frameIndex={frameIndex} />

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
      <div className="hidden lg:flex lg:flex-col lg:justify-between h-full pt-2 pb-2">
        <div>
          <CombinedSocialProofPill />
          <h1 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary leading-[1.15] tracking-tight">
            Spend Less Time <strong className="font-semibold">Searching</strong>.
            <br />
            Spend More Time <strong className="font-semibold">Earning</strong>.
          </h1>
          <p className="mt-6 text-sm md:text-base text-primary/70 font-mono leading-relaxed">
            Stop wasting hours searching ways to earn crypto. Rei AI Agent+Chatbot aggregates <strong>a 1000 Crypto <RotatorText words={ROTATOR_WORDS} /> in your Chat</strong>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <HeroPill label="Early Discovery" />
            <HeroPill label="Save Hours" />
            <HeroPill label="Bounties-to-Skills-Matched" />
          </div>
          <div className="mt-6 flex items-center gap-4 sm:gap-6 flex-wrap">
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
        <div className="flex items-stretch gap-4">
          <LatestBountyCard />
          <PlatformTicker />
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
        <div className="shrink-0 flex flex-wrap gap-1.5">
<CombinedSocialProofPill />
        </div>
        <h1 className="text-[1.5rem] sm:text-[1.75rem] font-light text-primary leading-[1.05] tracking-tight shrink-0">
          Spend Less Time <strong className="font-semibold">Searching</strong>.
          <br />
          Spend More Time <strong className="font-semibold">Earning</strong>.
        </h1>
        <p className="text-[11px] sm:text-[13px] text-primary/70 font-mono leading-relaxed whitespace-normal shrink-0">
          Stop wasting hours searching ways to earn crypto. Rei AI Agent+Chatbot aggregates <strong>a 1000 Crypto <RotatorText words={ROTATOR_WORDS} /> in your Chat</strong>.
        </p>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#181818] border border-primary/20 text-[10px] text-cream/80 font-mono whitespace-nowrap">
            Early Discovery
          </span>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#181818] border border-primary/20 text-[10px] text-cream/80 font-mono whitespace-nowrap">
            Save Hours
          </span>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#181818] border border-primary/20 text-[10px] text-cream/80 font-mono whitespace-nowrap">
            Bounties-to-Skills-Matched
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
        <img src={solanaX402Asset.url} alt="Solana + x402 payments enabled" className="h-14 lg:h-16 w-auto object-contain opacity-90" />
        <img src={nousHermesAsset.url} alt="Powered by Nous + Hermes Agent" className="h-20 lg:h-24 w-auto object-contain opacity-90" />
      </div>
    </div>

    {/* Block 3: How it works — centered */}
    <div className="h-screen w-full flex flex-col justify-center items-center px-8 lg:px-12 xl:px-16">
      <ScrollFadeIn>
        <h2 className="text-[1.5rem] md:text-[1.75rem] lg:text-[2rem] font-light text-primary leading-tight mb-4 text-center">
          How it works
        </h2>
      </ScrollFadeIn>
      <div className="flex flex-col gap-2.5 w-full max-w-md mx-auto">
        <ScrollFadeIn delay={100}>
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
        </ScrollFadeIn>
        <ScrollFadeIn delay={200}>
          <MiniFrame title="Tasks that fit your skills." extra={<MatchesSkillsPill />}>
            SkillSync surfaces bounties matched to your wallet history and on-chain track record — not random noise.
          </MiniFrame>
        </ScrollFadeIn>
        <ScrollFadeIn delay={300}>
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
        </ScrollFadeIn>
        <ScrollFadeIn delay={400}>
          <MiniFrame title="Find Highest Paying Bounties">
            Time is money. Rei filters for highest paying rewards automatically.
          </MiniFrame>
        </ScrollFadeIn>
      </div>
      <ScrollFadeIn delay={500}>
        <button
          className="btn-manga btn-manga-primary px-6 py-2 mt-4"
          onClick={() => (window.location.href = '/rei')}
        >
          Signup
        </button>
      </ScrollFadeIn>
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

