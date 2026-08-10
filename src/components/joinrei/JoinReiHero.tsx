import { useState, useEffect } from 'react';
import reiLogo from '@/assets/joinrei/rei-logo.png';
import desktopBgAsset from '@/assets/joinrei/joinrei-desktop-bg.png.asset.json';
import mobileBgAsset from '@/assets/joinrei/joinrei-mobile-bg.png.asset.json';
import { scrollToLastSection } from './scrollHelpers';

const desktopBg = desktopBgAsset.url;
const mobileBg = mobileBgAsset.url;

const outcomes = ['Reduces User Churn', 'Reduce CAC', 'Increase LTV'];
const campaignTypes = ['Bounty', 'Airdrop'];

const useRotator = (items: string[], interval = 3000) => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % items.length);
        setFade(true);
      }, 300);
    }, interval);
    return () => clearInterval(id);
  }, [items.length, interval]);

  return { value: items[index], fade };
};

export const JoinReiHero = () => {
  const [headlineComplete, setHeadlineComplete] = useState(false);
  const outcome = useRotator(outcomes, 3000);
  const campaign = useRotator(campaignTypes, 3600);

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

      <div className="w-full lg:w-[55%] h-full flex flex-col justify-between p-8 lg:p-12 xl:p-16 relative z-10">
        <div className="pt-2">
          <h1 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light leading-[1.15] tracking-tight" style={{ color: '#181818' }}>
            <span>Grow Your Project with</span>
            <br />
            <span>Diamond Handed Holders</span>
            <br />
            <span>to </span>
            <span
              className={`inline-block transition-opacity duration-300 ${outcome.fade ? 'opacity-100' : 'opacity-0'}`}
              style={{ color: '#ed565a' }}
            >
              {outcome.value}
            </span>
          </h1>

          <p
            className={`mt-6 text-sm md:text-base font-mono leading-relaxed transition-opacity duration-500 max-w-lg ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}
            style={{ color: '#181818' }}
          >
            Rei Filters out the JEETs &amp; Sybils that your{' '}
            <span
              className={`inline-block transition-opacity duration-300 ${campaign.fade ? 'opacity-100' : 'opacity-0'}`}
              style={{ color: '#ed565a' }}
            >
              {campaign.value}
            </span>{' '}
            campaigns attract.
          </p>
        </div>

        <div className={`transition-all duration-500 delay-300 ${headlineComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-6 flex-wrap">
            <button
              className="btn-manga"
              style={{ backgroundColor: '#ed565a', borderColor: '#ed565a', color: '#181818' }}
              onClick={scrollToLastSection}
            >
              Promote Task
            </button>
            <button
              onClick={scrollToHowItWorks}
              className="btn-manga btn-manga-outline"
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
    </section>
  );
};
