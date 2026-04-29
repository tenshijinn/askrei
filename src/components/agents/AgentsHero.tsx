import { useState, useEffect } from 'react';
import { ChevronDown, Terminal } from 'lucide-react';
import reiHero from '@/assets/joinrei/rei-hero.png';
import reiLogo from '@/assets/joinrei/rei-logo.png';

const lines = [
  '$ curl -H "x-api-key: rei_live_…" \\',
  '    https://rei.chat/api/feed',
  '{ "data": [',
  '  { "title": "Build a Solana indexer", ',
  '    "compensation": "$2,500", ',
  '    "source": "superteam" },',
  '  { "title": "Write Rust audit notes", ',
  '    "compensation": "$1,200" } ] }',
  '✓ 2 tasks routed to agent',
];

const scrollToPricing = () => {
  const sections = document.querySelectorAll('.snap-start');
  sections[sections.length - 1]?.scrollIntoView({ behavior: 'smooth' });
};

const scrollToHow = () => {
  const sections = document.querySelectorAll('.snap-start');
  sections[3]?.scrollIntoView({ behavior: 'smooth' });
};

export const AgentsHero = () => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setShown((p) => (p < lines.length ? p + 1 : p)), 350);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="h-screen snap-start relative flex overflow-hidden bg-[#0a0a0a]">
      <div className="w-full lg:w-[50%] h-full flex flex-col justify-between p-8 lg:p-12 xl:p-16 relative z-10">
        <div className="pt-2">
          <img src={reiLogo} alt="Rei" className="h-20 md:h-24 lg:h-28 w-auto mb-6" />
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 border border-primary/30 rounded-full text-[10px] font-mono uppercase tracking-wider text-primary/80">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Rei for Agents · Live
          </div>
          <h1 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary leading-[1.15] tracking-tight">
            Plug your agent into the<br />
            <span style={{ color: '#ed565a' }}>largest cross-chain index</span><br />
            of Web3 tasks, jobs &amp; bounties.
          </h1>
          <p className="mt-6 text-sm md:text-base text-primary/90 font-mono leading-relaxed max-w-lg">
            One read-only endpoint. JSON in, work out. Pay per call in SOL via x402 — no scraping, no rate-limit roulette, no PII.
          </p>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          <button className="btn-manga btn-manga-primary" onClick={scrollToPricing}>
            Get an API Key
          </button>
          <button
            onClick={scrollToHow}
            className="flex items-center gap-2 text-primary/70 hover:text-primary font-mono text-sm underline underline-offset-4 transition-colors cursor-pointer"
          >
            <ChevronDown className="h-4 w-4" />
            <span>How it Works</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="hidden lg:flex absolute right-0 top-0 w-[50%] h-full items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20">
          <img src={reiHero} alt="" className="w-full h-full object-cover object-center" />
        </div>
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d0d]/95 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="ml-2 text-[10px] font-mono text-cream/40 flex items-center gap-1.5">
              <Terminal className="h-3 w-3" /> agent.sh
            </span>
          </div>
          <div className="p-5 font-mono text-[11px] leading-relaxed text-cream/80 min-h-[260px]">
            {lines.slice(0, shown).map((l, i) => (
              <div
                key={i}
                className={
                  l.startsWith('$')
                    ? 'text-primary'
                    : l.startsWith('✓')
                    ? 'text-green-400 mt-2'
                    : 'text-cream/70'
                }
              >
                {l}
              </div>
            ))}
            <span className="inline-block w-2 h-3 bg-primary animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};
