import { ScrollFadeIn } from './ScrollFadeIn';
import shareGraphic from '@/assets/joinrei/share-graphic.png';

export const HomeReferral = () => {
  return (
    <section className="h-screen snap-start relative flex overflow-hidden bg-[#0a0a0a]">
      <div className="w-full lg:w-[45%] h-full flex flex-col justify-center items-center p-8 lg:p-12 xl:p-16 relative z-10">
        <ScrollFadeIn>
          <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light leading-[1.2] text-center mb-12">
            <span className="text-cream">Earn </span>
            <span className="text-primary">Solana</span>
            <span className="text-cream"> for Sharing </span>
            <span className="text-primary">Tasks on Socials</span>
          </h2>
        </ScrollFadeIn>

        <ScrollFadeIn delay={200}>
          <img 
            src={shareGraphic} 
            alt="Share and earn Solana" 
            className="h-40 w-auto object-contain"
          />
        </ScrollFadeIn>

        <ScrollFadeIn delay={300}>
          <button 
            className="btn-manga btn-manga-primary px-8 py-3 mt-6"
            onClick={() => window.location.href = '/rei'}
          >
            Signup
          </button>
        </ScrollFadeIn>
      </div>

      <div className="hidden lg:block absolute right-0 top-0 w-[55%] h-full p-8">
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black border-[0.5px] border-white/10">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/joinrei/terminal-video.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      <div className="lg:hidden absolute inset-0 -z-10 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-blue-600/30 to-primary/20" />
      </div>
    </section>
  );
};
