import { useState, useEffect } from 'react';
import { ScrollFadeIn } from './ScrollFadeIn';
import reiFlowDiagram from '@/assets/joinrei/rei-flow-diagram.png';

const rotatingPhrases = ['Task Platforms', 'Across Chains', 'Communities'];

export const HomeAggregation = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % rotatingPhrases.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-16">
      <div className="container mx-auto px-8 lg:px-16">
        <ScrollFadeIn>
          <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary text-center leading-tight mb-12">
            Find Tasks from Across{' '}
            <span 
              className={`inline-block transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
              style={{ color: '#ed565a' }}
            >
              {rotatingPhrases[phraseIndex]}
            </span>
          </h2>
        </ScrollFadeIn>

        <ScrollFadeIn delay={200}>
          <div className="flex justify-center">
            <img 
              src={reiFlowDiagram} 
              alt="Rei Aggregation Flow - Blockchains to Project Tasks to Aggregation Layer to Talent" 
              className="w-full max-w-3xl mx-auto object-contain"
            />
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay={300}>
          <div className="flex justify-center mt-8">
            <button 
              className="btn-manga btn-manga-primary px-8 py-3"
              onClick={() => window.location.href = '/rei'}
            >
              Signup
            </button>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
