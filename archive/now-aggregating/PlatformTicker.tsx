// Archived 'Now Aggregating' hero card (removed from ScrollVideoHero, replaced by AverageBountyCard).
// Kept for reuse elsewhere.
import { useState } from 'react';
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

export const PlatformTicker = () => {
  const [paused, setPaused] = useState(false);
  return (
    <div
      className="rounded-xl border-[0.5px] border-white/10 bg-[#141414]/60 backdrop-blur-sm px-5 py-3 flex-1 min-w-0 overflow-hidden flex flex-col justify-start"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="text-[10px] font-mono text-white/40 tracking-wider mb-2">Now Aggregating</p>
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
