import { ScrollFadeIn } from './ScrollFadeIn';
import { scrollToLastSection } from './scrollHelpers';
import solanaBadges from '@/assets/joinrei/solana-badges.png';
import hiwImg1 from '@/assets/joinrei/hiw-img1.png';
import hiwImg2 from '@/assets/joinrei/hiw-img2.png';
import hiwImg3 from '@/assets/joinrei/hiw-img3.png';

const steps = [
  { title: 'Signup', icon: hiwImg1 },
  { title: 'Post Task', icon: hiwImg2 },
  { title: 'Pay SOL', icon: hiwImg3, showBadges: true },
];

export const JoinReiHowItWorks = () => {
  return (
    <section id="how-to-use" className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20">
      <div className="container mx-auto px-8 lg:px-16">
        <ScrollFadeIn>
          <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary text-center mb-16">
            How to Use
          </h2>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <ScrollFadeIn key={step.title} delay={index * 150}>
              <div className="relative text-center flex flex-col items-center">
                <div className="p-8 border-[0.5px] border-white/10 rounded-2xl bg-[#141414] hover:bg-[#1a1a1a] transition-colors w-full">
                  <div className="flex justify-center mb-4">
                    <img src={step.icon} alt={step.title} className="h-24 w-auto object-contain" />
                  </div>
                  <h3 className="text-xl font-light text-cream font-mono">{step.title}</h3>
                </div>

                {step.showBadges && (
                  <div className="mt-6 flex justify-center">
                    <img src={solanaBadges} alt="Solana Pay & x402" className="h-10 w-auto object-contain" />
                  </div>
                )}
              </div>
            </ScrollFadeIn>
          ))}
        </div>

        <ScrollFadeIn delay={500}>
          <div className="flex justify-center mt-8">
            <button 
              className="btn-manga btn-manga-primary px-8 py-3"
              onClick={scrollToLastSection}
            >
              Promote Task
            </button>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};