import { useState, useEffect, useRef } from 'react';
import reiLogo from '@/assets/joinrei/rei-logo.png';
import desktopBgAsset from '@/assets/joinrei/joinrei-desktop-bg-2.png.asset.json';
import mobileBgAsset from '@/assets/joinrei/joinrei-mobile-bg-2.png.asset.json';
import arubaito from '@/assets/joinrei/logo-bar-arubaito.png';
import ignyte from '@/assets/joinrei/logo-bar-ignyte.png';
import solanaFoundation from '@/assets/joinrei/logo-bar-solana-foundation.png';
import colossium from '@/assets/joinrei/logo-bar-colossium.png';
import { scrollToLastSection } from './scrollHelpers';

const desktopBg = desktopBgAsset.url;
const mobileBg = mobileBgAsset.url;

const outcomes = ['Reduce User Churn', 'Reduce CAC', 'Increase LTV'];

const tickerLogos = [
  { src: arubaito, alt: 'Arubaito - Private Members Network Club', href: 'https://arubaito.app' },
  { src: ignyte, alt: 'IGNYTE - 1 of 15 Shortlisted / 3000 Applicants' },
  { src: solanaFoundation, alt: 'Solana Foundation' },
  { src: colossium, alt: 'Colosseum Frontier', href: 'https://arena.colosseum.org/projects/explore/rei' },
];

/** Types a word in, holds, types it out, then moves to the next word. */
const useTypeRotator = (items: string[], typeSpeed = 55, eraseSpeed = 30, hold = 1600) => {
  const [text, setText] = useState('');
  const indexRef = useRef(0);
  const charRef = useRef(0);
  const phaseRef = useRef<'typing' | 'holding' | 'erasing'>('typing');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      const word = items[indexRef.current];
      const phase = phaseRef.current;

      if (phase === 'typing') {
        charRef.current += 1;
        setText(word.slice(0, charRef.current));
        if (charRef.current >= word.length) {
          phaseRef.current = 'holding';
          timer = setTimeout(step, hold);
          return;
        }
        timer = setTimeout(step, typeSpeed);
        return;
      }

      if (phase === 'holding') {
        phaseRef.current = 'erasing';
        timer = setTimeout(step, eraseSpeed);
        return;
      }

      charRef.current -= 1;
      setText(word.slice(0, Math.max(charRef.current, 0)));
      if (charRef.current <= 0) {
        indexRef.current = (indexRef.current + 1) % items.length;
        phaseRef.current = 'typing';
      }
      timer = setTimeout(step, eraseSpeed);
    };

    timer = setTimeout(step, typeSpeed);
    return () => clearTimeout(timer);
  }, [items, typeSpeed, eraseSpeed, hold]);

  return text;
};

export const JoinReiHero = () => {
  const [headlineComplete, setHeadlineComplete] = useState(false);
  const outcome = useTypeRotator(outcomes);

  useEffect(() => {
    const timer = setTimeout(() => setHeadlineComplete(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const scrollToHowItWorks = () => {
    const sections = document.querySelectorAll('.snap-start');
    const target = Array.from(sections).find((s) =>
      s.textContent?.includes('How it works')
    );
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else if (sections.length > 1) {
      sections[1].scrollIntoView({ behavior: 'smooth' });
    }
  };

  const pill =
    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-transparent border border-[#181818] text-[11px] font-normal whitespace-nowrap';


  return (
    <section className="h-screen snap-start relative flex overflow-hidden bg-[#0a0a0a]">
      {/* Full-width background: desktop */}
      <div className="hidden lg:block absolute inset-0">
        <img src={desktopBg} alt="Rei's Diamond wallet behaviour score" className="w-full h-full object-cover object-center" />
      </div>
      {/* Full-width background: mobile */}
      <div className="lg:hidden absolute inset-0">
        <img src={mobileBg} alt="Rei's Diamond wallet behaviour score" className="w-full h-full object-cover object-center" />
      </div>

      <div className="w-full lg:w-[55%] h-full p-8 lg:p-12 xl:p-16 relative z-10">
        <div className="pt-2">
          <h1 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-bold leading-[1.15] tracking-tight" style={{ color: '#181818' }}>
            <span>Your Crypto Growth AI.</span>
            <br />
            <span>Filters for Diamond Hand Holders.</span>
            <br />
            <span>to </span>
            <span style={{ color: '#ed565a' }}>
              {outcome}
              <span className="animate-pulse">▌</span>
            </span>
          </h1>

          <div
            className={`mt-6 text-sm md:text-base font-mono leading-relaxed transition-opacity duration-500 max-w-lg ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}
            style={{ color: '#181818' }}
          >
            <p>
              Rei AI <strong className="font-bold">reduces</strong> marketing budget
              <br />
              protects from <strong className="font-bold">token dumpers</strong>
              <br />
              by filtering out <strong className="font-bold">JEETs</strong> &amp; <strong className="font-bold">Sybils</strong>
              <br />
              and rewarding <strong className="font-bold">Diamond Hands</strong>.
            </p>
            <p className="mt-4 flex flex-wrap items-center gap-2">
              <span>through</span>
              <span className={pill} style={{ color: '#181818' }}>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 1.5l2.4 1.75 2.96-.05 1.05 2.77 2.44 1.68-.86 2.83.86 2.83-2.44 1.68-1.05 2.77-2.96-.05L12 21.5l-2.4-1.74-2.96.05-1.05-2.77-2.44-1.68.86-2.83-.86-2.83 2.44-1.68 1.05-2.77 2.96.05zm-1.03 13.02l5.13-5.13-1.24-1.24-3.89 3.89-1.79-1.79-1.24 1.24z" />
                </svg>
                Premium X
              </span>
              <span className={pill} style={{ color: '#181818' }}>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <circle cx="11" cy="11" r="6" />
                  <path d="M11 8v6M8 11h6" opacity="0.5" />
                  <path d="M20 20l-4.5-4.5" />
                </svg>
                Wallet Scanning
              </span>
              <span className={pill} style={{ color: '#181818' }}>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
                  <circle cx="16" cy="7" r="2" />
                  <circle cx="10" cy="17" r="2" />
                </svg>
                Skill-Sync
              </span>
            </p>
          </div>
        </div>


        <div className={`absolute left-8 lg:left-12 xl:left-16 top-[60%] -translate-y-1/2 transition-all duration-500 delay-300 ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-6 flex-wrap">
            <button
              className="btn-manga font-bold"
              style={{ backgroundColor: '#ed565a', borderColor: '#ed565a', color: '#181818' }}
              onClick={scrollToLastSection}
            >
              Promote Task
            </button>
            <button
              onClick={scrollToHowItWorks}
              className="btn-manga btn-manga-outline font-bold"
              style={{ backgroundColor: '#181818', borderColor: '#181818' }}
            >
              How it Works
            </button>
          </div>
        </div>
      </div>

      <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-30 bg-[#0a0a0a] p-2 lg:p-3">
        <img src={reiLogo} alt="Rei" className="h-16 lg:h-20 xl:h-24 w-auto block" />
      </div>

      {/* Logo ticker */}
      <div className="absolute bottom-0 left-0 right-0 z-20 py-4 overflow-hidden">
        <div className="flex w-max animate-[jr-ticker_28s_linear_infinite] gap-12 lg:gap-20 pr-12 lg:pr-20">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-12 lg:gap-20 shrink-0" aria-hidden={dup === 1}>
              {tickerLogos.map((logo) =>
                logo.href ? (
                  <a key={logo.alt} href={logo.href} target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100 transition-opacity">
                    <img src={logo.src} alt={logo.alt} className="h-10 lg:h-14 w-auto object-contain" />
                  </a>
                ) : (
                  <img key={logo.alt} src={logo.src} alt={logo.alt} className="h-10 lg:h-14 w-auto object-contain opacity-90" />
                )
              )}
            </div>
          ))}
        </div>
        <style>{`@keyframes jr-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </div>
    </section>
  );
};
