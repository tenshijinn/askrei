import { ScrollFadeIn } from './ScrollFadeIn';
import { ParallaxWrapper } from './ParallaxWrapper';
import reiFlowDiagram from '@/assets/joinrei/rei-flow.png';

export const JoinReiAggregation = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-16">
      <div className="container mx-auto px-8 lg:px-16">
        <ScrollFadeIn>
          <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary text-center leading-tight mb-12">
            Get Task Talent from Cross-Chains,<br />
            Cross Platforms, Cross Communities
          </h2>
        </ScrollFadeIn>

        <ScrollFadeIn delay={200}>
          <ParallaxWrapper speed={0.05}>
            <div className="flex justify-center">
              <img 
                src={reiFlowDiagram} 
                alt="Rei Aggregation Flow - Blockchains to Project Tasks to Aggregation Layer to Talent" 
                className="w-full max-w-3xl mx-auto object-contain"
              />
            </div>
          </ParallaxWrapper>
        </ScrollFadeIn>

        <ScrollFadeIn delay={300}>
          <div className="flex justify-center mt-8">
            <button 
              className="btn-manga btn-manga-primary px-8 py-3"
              onClick={() => window.location.href = '/rei'}
            >
              Promote Task
            </button>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};