import { ScrollFadeIn } from './ScrollFadeIn';
import { ParallaxWrapper } from './ParallaxWrapper';

const VerifiedLoginPill = () => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#181818] border border-primary/20">
    <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
    <span className="text-xs text-cream/80 font-mono">Verified Login</span>
  </div>
);

const TopRewardsPill = () => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#181818] border border-primary/20">
    <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
    <span className="text-xs text-cream/80 font-mono">Highest Paying</span>
  </div>
);

const ProofOfTalentPill = () => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#181818] border border-primary/20">
    <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l2.39 4.84L20 7.74l-4 3.9.94 5.5L12 14.77 7.06 17.14 8 11.64l-4-3.9 5.61-.9z" />
    </svg>
    <span className="text-xs text-cream/80 font-mono">Proof-of-Talent</span>
  </div>
);

const SimplePill = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#181818] border border-primary/20">
    <span className="text-xs text-cream/80 font-mono">{label}</span>
  </div>
);

const SinglePill = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 flex-wrap pt-4">{children}</div>
);

interface FrameProps {
  title: string;
  children: React.ReactNode;
  speed?: number;
  delay?: number;
  extra?: React.ReactNode;
}

const Frame = ({ title, children, speed = 0.04, delay = 0, extra }: FrameProps) => (
  <ParallaxWrapper speed={speed}>
    <ScrollFadeIn delay={delay}>
      <div className="rei-terminal rounded-2xl border-[0.5px] border-white/10 p-8 md:p-10 bg-[#141414]/60 backdrop-blur-sm h-full flex flex-col min-h-[260px]">
        <h3 className="text-xl md:text-2xl lg:text-3xl font-light text-primary leading-tight mb-4">
          {title}
        </h3>
        <div className="text-sm md:text-base font-mono text-primary/70 leading-relaxed flex-1">
          {children}
        </div>
        {extra}
      </div>
    </ScrollFadeIn>
  </ParallaxWrapper>
);

export const HomeChatDemo = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20">
      <div className="container mx-auto px-8 lg:px-16">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary text-center mb-12">
            How it works
          </h2>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
          <Frame
            title="One feed. Every platform."
            speed={0}
            delay={0}
            extra={
              <SinglePill>
                <SimplePill label="Galxe" />
                <SimplePill label="Zealy" />
                <SimplePill label="TaskOn" />
                <SimplePill label="Earn" />
              </SinglePill>
            }
          >
            Stop tab-hopping across quest platforms. Rei aggregates live bounties into one matched feed.
          </Frame>

          <Frame
            title="Tasks that fit your skills."
            speed={0}
            delay={100}
            extra={<SinglePill><MatchesSkillsPill /></SinglePill>}
          >
            SkillSync surfaces bounties matched to your wallet history and on-chain track record — not random noise.
          </Frame>

          <Frame
            title="Get verified, get prioritised."
            speed={0}
            delay={200}
            extra={<SinglePill><VerifiedLoginPill /><ProofOfTalentPill /></SinglePill>}
          >
            Verified X + 60s voice intro gives you a proof-of-talent score, so projects see{' '}
            <strong className="text-cream font-semibold">you, not the farmers</strong>.
          </Frame>

          <Frame
            title="Get paid on-chain."
            speed={0}
            delay={300}
            extra={
              <SinglePill>
                <SimplePill label="SOL" />
                <SimplePill label="Points & Rewards" />
                <SimplePill label="NFT Drops" />
              </SinglePill>
            }
          >
            Settle bounties directly to your wallet, stack points passively, and unlock NFT rewards as you contribute.
          </Frame>
        </div>

        <ScrollFadeIn delay={400}>
          <div className="mt-10 flex justify-center">
            <button
              className="btn-manga btn-manga-primary flex items-center gap-3 px-8 py-3"
              onClick={() => (window.location.href = '/rei')}
            >
              Signup
            </button>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
