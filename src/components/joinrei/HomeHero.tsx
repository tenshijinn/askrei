import { useState, useEffect } from 'react';

import reiHero from '@/assets/joinrei/rei-hero.png';
import reiLogo from '@/assets/joinrei/rei-logo.png';
import colosseumLogo from '@/assets/joinrei/colosseum-logo.png';
import reiSpeechBubble from '@/assets/joinrei/rei-speech-bubble.gif';

const rotatingPlatforms = ['Galxe', 'QuestN', 'TaskOn', 'Zealy', 'Layer3', 'Crew3', 'RabbitHole'];
const rotatingTaskWords = ['Tasks', 'Bounties', 'Quests'];

export const HomeHero = () => {
  const [headlineComplete, setHeadlineComplete] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [taskFade, setTaskFade] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setHeadlineComplete(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingPlatforms.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaskFade(false);
      setTimeout(() => {
        setTaskIndex((prev) => (prev + 1) % rotatingTaskWords.length);
        setTaskFade(true);
      }, 300);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const scrollToNextSection = () => {
    const sections = document.querySelectorAll('.snap-start');
    const target = Array.from(sections).find((s) =>
      s.textContent?.includes('How it works')
    );
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };


  return (
    <section className="h-screen snap-start relative flex overflow-hidden bg-[#0a0a0a]">
      <div className="w-full lg:w-[45%] h-full flex flex-col justify-between p-8 lg:p-12 xl:p-16 relative z-10">
        <div className="pt-2">
          <h1 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary leading-[1.15] tracking-tight">
            Discover Profitable Crypto Bounties,
            <br />
            Before Everyone Else.
          </h1>

          <p className={`mt-6 text-sm md:text-base text-primary/70 font-mono leading-relaxed transition-opacity duration-500 lg:whitespace-nowrap ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}>
            Get a 1000 Bounties in your Chat
          </p>

          <div className={`mt-4 flex flex-wrap gap-2 transition-opacity duration-500 delay-200 ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}>
            <span className="px-4 py-1.5 rounded-full bg-[#181818] border border-primary/20 text-xs text-cream/80 font-mono">
              Early Discovery
            </span>
            <span className="px-4 py-1.5 rounded-full bg-[#181818] border border-primary/20 text-xs text-cream/80 font-mono">
              Consistent Profits
            </span>
            <span className="px-4 py-1.5 rounded-full bg-[#181818] border border-primary/20 text-xs text-cream/80 font-mono">
              Save Hours
            </span>
            <span className="px-4 py-1.5 rounded-full bg-[#181818] border border-primary/20 text-xs text-cream/80 font-mono">
              Stop Scrolling
            </span>
            <span className="px-4 py-1.5 rounded-full bg-[#181818] border border-primary/20 text-xs text-cream/80 font-mono">
              Skip Saturation
            </span>
            <span className="px-4 py-1.5 rounded-full bg-[#181818] border border-primary/20 text-xs text-cream/80 font-mono">
              No More FOMO
            </span>
            <span className="px-4 py-1.5 rounded-full bg-[#181818] border border-primary/20 text-xs text-cream/80 font-mono">
              Stay Ahead
            </span>
            <span className="px-4 py-1.5 rounded-full bg-[#181818] border border-primary/20 text-xs text-cream/80 font-mono">
              Financial Freedom
            </span>
          </div>
        </div>

        <div className={`transition-all duration-500 delay-300 ${headlineComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-6 flex-wrap">
            <button 
              className="btn-manga"
              style={{ backgroundColor: '#ed565a', borderColor: '#ed565a', color: '#181818' }}
              onClick={() => window.location.href = '/rei'}
            >
              Start Now
            </button>

            <button 
              onClick={scrollToNextSection}
              className="btn-manga btn-manga-outline"
            >
              How it Works
            </button>
          </div>
        </div>
      </div>

      <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-30 bg-[#0a0a0a] p-2 lg:p-3">
        <img src={reiLogo} alt="Rei AI" className="h-16 lg:h-20 xl:h-24 w-auto block" />
      </div>



      <div className="hidden lg:block absolute right-0 top-0 w-[55%] h-full">
        <img src={reiHero} alt="Rei AI Agent" className="w-full h-full object-cover object-center" />
        <div className="absolute top-[28%] left-[35%]">
          <img src={reiSpeechBubble} alt="Rei typing" className="h-20 xl:h-24 w-auto" />
        </div>
        <div className="absolute bottom-8 right-8 flex flex-col items-end gap-3">
          <a href="https://arena.colosseum.org/projects/explore/rei" target="_blank" rel="noopener noreferrer">
            <img src={colosseumLogo} alt="Colosseum" className="h-8 xl:h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>

      <div className="lg:hidden absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10" />
        <img src={reiHero} alt="Rei AI Agent" className="w-full h-full object-cover object-right-center opacity-50" />
      </div>

      <div className="lg:hidden absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
        <a href="https://arena.colosseum.org/projects/explore/rei" target="_blank" rel="noopener noreferrer">
          <img src={colosseumLogo} alt="Colosseum" className="h-6 w-auto object-contain" />
        </a>
      </div>
    </section>
  );
};
