import { ScrollFadeIn } from './ScrollFadeIn';
import reiCrossPlatform from '@/assets/joinrei/rei-cross-platform.png';
import twitterVerifiedBadge from '@/assets/joinrei/twitter-verified-badge.png';

export const HomeValueProp = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center overflow-hidden bg-[#0a0a0a]">
      <div className="grid lg:grid-cols-2 gap-0 items-center w-full">
        <div className="hidden lg:block order-1 relative h-screen">
          <img 
            src={reiCrossPlatform}
            alt="Rei cross-platform exposure"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-6 order-2 px-8 lg:px-16">
          <ScrollFadeIn>
            <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary leading-[1.2]">
              Earn Points, Redeem NFTs
            </h2>
          </ScrollFadeIn>

          <ScrollFadeIn delay={100}>
            <p className="text-sm md:text-base font-mono text-primary/70 leading-relaxed">
              Accumulate points passively as you use the platform and redeem for NFTs.
            </p>
          </ScrollFadeIn>

          <ScrollFadeIn delay={200}>
            <blockquote className="text-xs md:text-sm font-mono text-primary/50 leading-relaxed border-l border-primary/30 pl-4 italic">
              "We're working with a variety of different artists who will create their own artistic expression of Rei | Royalties split with artists."
            </blockquote>
          </ScrollFadeIn>

          <div className="flex items-center gap-4 pt-2">
            <ScrollFadeIn delay={300}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#181818] border border-primary/20">
                <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <img src={twitterVerifiedBadge} alt="Verified" className="h-4 w-4 object-contain" />
                <span className="text-xs text-cream/80 font-mono">Login</span>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={400}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#181818] border border-primary/20">
                <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12l2 2 4-4" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                </svg>
                <span className="text-xs text-cream/80 font-mono">Matches Skills to Tasks</span>
              </div>
            </ScrollFadeIn>
          </div>

          <ScrollFadeIn delay={500}>
            <button 
              className="btn-manga btn-manga-primary px-8 py-3 mt-4"
              onClick={() => window.location.href = '/rei'}
            >
              Signup
            </button>
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
};
