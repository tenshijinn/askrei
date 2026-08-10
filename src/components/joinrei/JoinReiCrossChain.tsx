import { useEffect, useState } from 'react';
import { ScrollFadeIn } from './ScrollFadeIn';
import { scrollToLastSection } from './scrollHelpers';
import reiFlowDiagram from '@/assets/joinrei/rei-aggregation-matching.png';
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

const rotatingWords = ['Chains', 'Platforms', 'Communities', 'Borders'];

const PlatformTicker = () => {
  const [paused, setPaused] = useState(false);
  return (
    <div
      className="rounded-xl border-[0.5px] border-white/10 bg-[#141414]/60 backdrop-blur-sm px-5 py-3 max-w-[420px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="text-[10px] font-mono text-white/40 tracking-wider mb-2">Now Aggregating</p>
      <div className="xchain-ticker-viewport">
        <div className="xchain-ticker-track" style={{ animationPlayState: paused ? 'paused' : 'running' }}>
          {[...PLATFORM_LOGOS, ...PLATFORM_LOGOS].map((l, i) => (
            <img key={i} src={l.src} alt={l.alt} className="h-10 w-auto object-contain opacity-60 shrink-0" />
          ))}
        </div>
      </div>
      <style>{`
        .xchain-ticker-viewport { overflow: hidden; width: 100%; }
        .xchain-ticker-track {
          display: flex; align-items: center; gap: 3rem; width: max-content;
          animation: xchain-ticker 40s linear infinite;
        }
        @keyframes xchain-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export const JoinReiCrossChain = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % rotatingWords.length);
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="min-h-screen snap-start relative flex items-center overflow-hidden bg-black">
      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-0 items-center w-full">
        <div className="hidden lg:flex order-1 relative items-center justify-center pl-4 pr-6 py-10">
          <img
            src={reiFlowDiagram}
            alt="Rei aggregation flow from blockchains and task platforms to talent"
            className="w-full max-w-none object-contain max-h-[88vh]"
          />
        </div>

        <div className="space-y-6 order-2 px-8 lg:pr-16 lg:pl-4">
          <ScrollFadeIn>
            <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary leading-[1.2]">
              Find Quality Users
              <br />
              from Cross-
              <span
                className={`inline-block transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
                style={{ color: '#ed565a' }}
              >
                {rotatingWords[index]}
              </span>
            </h2>
          </ScrollFadeIn>

          <ScrollFadeIn delay={100}>
            <p className="text-sm md:text-base font-mono text-primary/70 leading-relaxed">
              Your tasks will get exposure to cross-platform traffic through Rei.
            </p>
          </ScrollFadeIn>

          <ScrollFadeIn delay={150}>
            <blockquote className="text-xs md:text-sm font-mono text-primary/50 leading-relaxed border-l border-primary/30 pl-4 italic">
              "A user who only uses Zealy may be matched to your Task on QuestN, meaning your tasks
              and community is now exposed to the traffic from every task platform, community and
              project userbase that Rei works with."
            </blockquote>
          </ScrollFadeIn>

          <ScrollFadeIn delay={200}>
            <PlatformTicker />
          </ScrollFadeIn>


          <ScrollFadeIn delay={300}>
            <button className="btn-manga btn-manga-primary px-8 py-3 mt-4" onClick={scrollToLastSection}>
              Promote Task
            </button>
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
};
