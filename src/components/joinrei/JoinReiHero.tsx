import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import reiHero from '@/assets/joinrei/rei-hero.png';
import reiSpeechBubble from '@/assets/joinrei/rei-speech-bubble.gif';
import reiLogo from '@/assets/joinrei/rei-logo.png';
import { scrollToLastSection } from './scrollHelpers';

const platforms = ['Zealy', 'Layer3', 'QuestN', 'TaskOn', 'Crew3', 'Bounty0x', 'Dework', 'RabbitHole'];

export const JoinReiHero = () => {
  const [headlineComplete, setHeadlineComplete] = useState(false);
  const [platformIndex, setPlatformIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setHeadlineComplete(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPlatformIndex((prev) => (prev + 1) % platforms.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
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
      <div className="w-full lg:w-[45%] h-full flex flex-col justify-between p-8 lg:p-12 xl:p-16 relative z-10">
        <div className="pt-2">
          <img src={reiLogo} alt="Rei" className="h-20 md:h-24 lg:h-28 w-auto mb-6" />
          <h1 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary leading-[1.15] tracking-tight">
            <span>Many </span>
            <span 
              className={`inline-block transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
              style={{ minWidth: '4ch', color: '#ed565a' }}
            >
              {platforms[platformIndex]}
            </span>
            <span> Users</span>
            <br />
            <span>Farm Your Tokens & Leave</span>
            <br />
            <span>We're Fixing That.</span>
          </h1>

          <p className={`mt-6 text-sm md:text-base text-primary/90 font-mono leading-relaxed transition-opacity duration-500 max-w-lg ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}>
            Quality users, less churn powered by Rei.
          </p>
        </div>

        <div className={`transition-all duration-500 delay-300 ${headlineComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-6 flex-wrap">
            <button 
              className="btn-manga btn-manga-outline"
              onClick={scrollToLastSection}
            >
              Promote Task
            </button>
            <button 
              onClick={scrollToHowItWorks}
              className="flex items-center gap-2 text-primary/70 hover:text-primary font-mono text-sm underline underline-offset-4 transition-colors cursor-pointer"
            >
              <ChevronDown className="h-4 w-4" />
              <span>How it Works</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block absolute right-0 top-0 w-[55%] h-full">
        <img src={reiHero} alt="Rei AI Agent" className="w-full h-full object-cover object-center" />
        <div className="absolute top-[28%] left-[35%]">
          <img src={reiSpeechBubble} alt="Rei typing" className="h-20 xl:h-24 w-auto" />
        </div>
      </div>

      <div className="lg:hidden absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10" />
        <img src={reiHero} alt="Rei AI Agent" className="w-full h-full object-cover object-right-center opacity-50" />
      </div>

    </section>
  );
};