import { ScrollFadeIn } from './ScrollFadeIn';
import agentImg from '@/assets/joinrei/ai-agent.png';
import mockupImg from '@/assets/joinrei/app-mockup.png';
import reiLogo from '@/assets/rei-logo-transparent.png';

const bankGothic = {
  fontFamily: '"Bank Gothic", "Bank Gothic Medium BT", "Copperplate Gothic Bold", "Trade Gothic", "Arial Black", sans-serif',
  letterSpacing: '0.222em',
  lineHeight: 0.5,
  textTransform: 'uppercase' as const,
};

const LogoBox = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div
    className="w-14 h-14 md:w-16 md:h-16 border border-current/40 flex items-center justify-center shrink-0 p-1.5"
    style={dark ? { backgroundColor: '#181818' } : undefined}
  >
    {children}
  </div>
);

export const HomeAgentChatbot = () => {
  return (
    <section className="min-h-screen snap-start relative flex overflow-hidden">
      {/* Left — Agent */}
      <div className="w-1/2 relative flex items-center justify-center p-10 lg:p-16" style={{ backgroundColor: '#faf1e1' }}>
        <div className="flex items-start gap-6 md:gap-10 max-w-2xl">
          <div className="flex flex-col gap-4 pt-2 text-[#0a0a0a]">
            <ScrollFadeIn>
              <div className="flex flex-col gap-3 items-start">
                <LogoBox dark>
                  <img src={reiLogo} alt="Rei" className="w-full h-full object-contain" />
                </LogoBox>
                <h2 className="text-xs md:text-sm font-bold" style={bankGothic}>
                  Agent
                </h2>
              </div>
            </ScrollFadeIn>
            <ScrollFadeIn delay={150}>
              <div className="font-mono text-[0.7rem] md:text-xs text-[#0a0a0a]/80 leading-relaxed max-w-[14rem] mt-2">
                <p>&gt; Autonomous AI agent scanning crypto bounty platforms 24/7, filtering by skills, surfacing only paid gigs.</p>
              </div>
            </ScrollFadeIn>
          </div>
          <img
            src={agentImg}
            alt="Rei autonomous agent"
            className="max-h-[80vh] w-auto object-contain"
          />
        </div>
      </div>

      {/* Right — Chatbot */}
      <div className="w-1/2 relative flex items-center justify-center p-10 lg:p-16" style={{ backgroundColor: '#0e0e0e' }}>
        <div className="flex items-start gap-6 md:gap-10 max-w-2xl">
          <div className="flex flex-col gap-4 pt-2 text-cream">
            <ScrollFadeIn>
              <div className="flex flex-col gap-3 items-start">
                <LogoBox>
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden="true">
                    <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.844l-5.36-6.99L4.6 22H1.34l8.02-9.17L1 2h7.02l4.84 6.4L18.24 2zm-2.4 18h1.9L7.27 4H5.25l10.59 16z"/>
                  </svg>
                </LogoBox>
                <h2 className="text-xs md:text-sm font-bold" style={bankGothic}>
                  Chatbot
                </h2>
              </div>
            </ScrollFadeIn>
            <ScrollFadeIn delay={150}>
              <div className="font-mono text-[0.7rem] md:text-xs text-cream/80 leading-relaxed max-w-[14rem] space-y-1 mt-2">
                <p>&gt; Just ask: "bounties this week paying over $100."</p>
                <p>&gt; Rei replies in seconds with matched, ranked quests.</p>
                <p>&gt; Tap a card → claim → start earning SOL.</p>
                <p>&gt; Your personal bounty concierge, always on.</p>
              </div>
            </ScrollFadeIn>
          </div>
          <img
            src={mockupImg}
            alt="Rei chatbot bounty results"
            className="max-h-[80vh] w-auto object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
};
