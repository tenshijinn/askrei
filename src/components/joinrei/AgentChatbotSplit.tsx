import { ScrollFadeIn } from './ScrollFadeIn';
import { ParallaxWrapper } from './ParallaxWrapper';
import agentImage from '@/assets/joinrei/ai-agent.png';
import appMockup from '@/assets/joinrei/app-mockup.png';
import reiLogo from '@/assets/joinrei/rei-logo.png';

interface AgentChatbotSplitProps {
  variant: 'hunter' | 'project';
}

const COPY = {
  hunter: {
    agent: "An autonomous agent that hunts bounties across every chain, every platform, every day — so you don't have to refresh ten dashboards.",
    chatbot: "Or just ask. \"Show me bounties paying over $100 this week.\" Rei replies in seconds with live, claimable tasks.",
  },
  project: {
    agent: "Our agent surfaces your bounty to qualified hunters across X, Discord and partner platforms — automated distribution, zero manual posting.",
    chatbot: "Quality talent asks Rei what to work on. When your bounty matches their skills and history, Rei sends them straight to you.",
  },
};

const bankGothicStyle: React.CSSProperties = {
  fontFamily: "'Bank Gothic', 'Copperplate Gothic Bold', 'Saira Condensed', 'Arial Narrow', sans-serif",
  letterSpacing: '0.222em',
  lineHeight: 0.5,
  textTransform: 'uppercase',
  fontWeight: 500,
};

export const AgentChatbotSplit = ({ variant }: AgentChatbotSplitProps) => {
  const copy = COPY[variant];

  return (
    <section className="min-h-screen snap-start relative flex flex-col md:flex-row overflow-hidden">
      {/* LEFT — AGENT (cream) */}
      <div className="relative w-full md:w-1/2 h-[50vh] md:h-screen bg-[#faf1e1] overflow-hidden flex flex-col p-8 lg:p-12 xl:p-16">
        <ScrollFadeIn>
          <h2 className="text-[#181818] text-[2.5rem] md:text-[3rem] lg:text-[3.5rem]" style={bankGothicStyle}>
            Agent
          </h2>
        </ScrollFadeIn>

        <div className="absolute inset-0 pointer-events-none">
          <ParallaxWrapper speed={0.15} className="absolute inset-0">
            <img
              src={agentImage}
              alt="Rei agent figure"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[85%] w-auto object-contain"
            />
          </ParallaxWrapper>
        </div>

        <div className="mt-auto relative z-10 max-w-md">
          <ScrollFadeIn delay={200}>
            <div className="inline-block bg-[#181818] px-3 py-1 mb-3">
              <span className="font-mono text-xs text-[#faf1e1]">𝕏 @AskRei_</span>
            </div>
            <p className="font-mono text-sm md:text-base text-[#181818] leading-relaxed">
              {copy.agent}
            </p>
          </ScrollFadeIn>
        </div>
      </div>

      {/* RIGHT — CHATBOT (black) */}
      <div className="relative w-full md:w-1/2 h-[50vh] md:h-screen bg-[#0a0a0a] overflow-hidden flex flex-col p-8 lg:p-12 xl:p-16">
        <ScrollFadeIn>
          <h2 className="text-primary text-[2.5rem] md:text-[3rem] lg:text-[3.5rem]" style={bankGothicStyle}>
            Chatbot
          </h2>
        </ScrollFadeIn>

        <div className="absolute inset-0 pointer-events-none">
          <ParallaxWrapper speed={-0.12} className="absolute inset-0">
            <img
              src={appMockup}
              alt="Rei chatbot bounties app mockup"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] w-auto object-contain"
            />
          </ParallaxWrapper>
        </div>

        <div className="mt-auto relative z-10 max-w-md">
          <ScrollFadeIn delay={200}>
            <div className="inline-flex items-center gap-2 mb-3">
              <img src={reiLogo} alt="Rei" className="h-8 w-auto" />
              <span className="font-mono text-xs text-[#ed565a]">REI.CHAT</span>
            </div>
            <p className="font-mono text-sm md:text-base text-primary/90 leading-relaxed">
              {copy.chatbot}
            </p>
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
};
