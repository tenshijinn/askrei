import { ScrollFadeIn } from './ScrollFadeIn';
import { ParallaxWrapper } from './ParallaxWrapper';
import splitImage from '@/assets/joinrei/agent-chatbot-split.png';
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
      <div className="relative w-full md:w-1/2 h-[50vh] md:h-screen bg-[#f5f0e6] overflow-hidden flex flex-col p-8 lg:p-12 xl:p-16">
        <ScrollFadeIn>
          <h2 className="text-[#181818] text-[2.5rem] md:text-[3rem] lg:text-[3.5rem]" style={bankGothicStyle}>
            Agent
          </h2>
        </ScrollFadeIn>

        <div className="absolute inset-0 pointer-events-none">
          <ParallaxWrapper speed={0.15} className="absolute inset-0 flex items-center justify-center">
            <img
              src={splitImage}
              alt="Rei agent figure"
              className="h-[90%] w-full object-cover object-left"
              style={{ objectPosition: '25% center', clipPath: 'inset(0 50% 0 0)' }}
            />
          </ParallaxWrapper>
        </div>

        <div className="mt-auto relative z-10 max-w-md">
          <ScrollFadeIn delay={200}>
            <div className="inline-block bg-[#181818] px-3 py-1 mb-3">
              <span className="font-mono text-xs text-[#f5f0e6]">𝕏 @AskRei_</span>
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
          <div className="leading-none">
            <h2 className="text-primary text-[2.5rem] md:text-[3rem] lg:text-[3.5rem]" style={bankGothicStyle}>
              Chatbot
            </h2>
            <h2
              className="text-primary/30 text-[2.5rem] md:text-[3rem] lg:text-[3.5rem] mt-3"
              style={bankGothicStyle}
            >
              Chatbot
            </h2>
          </div>
        </ScrollFadeIn>

        <div className="absolute inset-0 pointer-events-none">
          <ParallaxWrapper speed={-0.12} className="absolute right-0 top-1/2 -translate-y-1/2 w-[70%]">
            <div className="relative">
              <div
                className="absolute inset-0 border border-[#ed565a]/30 rounded-2xl bg-[#181818]/60 backdrop-blur-sm"
                style={{ transform: 'translate(20px, 20px) rotate(2deg)' }}
              />
              <div
                className="absolute inset-0 border border-[#ed565a]/40 rounded-2xl bg-[#181818]/80 backdrop-blur-sm"
                style={{ transform: 'translate(10px, 10px) rotate(1deg)' }}
              />
              <div className="relative border border-[#ed565a]/60 rounded-2xl bg-[#1a1a1a] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#ed565a] font-bold text-lg">Bounties</h3>
                  <div className="flex gap-2 text-[#ed565a]/60 text-xs">⚙</div>
                </div>
                <p className="text-[#ed565a]/70 text-xs font-mono">
                  Rei: Here's what I found for you
                </p>
                {[
                  { name: 'Galxe Quest', desc: 'Community activation campaign', pay: '0.5 SOL' },
                  { name: 'QuestN Bounty', desc: 'Design social media assets', pay: '1.2 SOL' },
                  { name: 'Superteam Earn', desc: 'Contribute to ecosystem', pay: '25 USDC' },
                ].map((b) => (
                  <div
                    key={b.name}
                    className="flex items-center justify-between border border-[#ed565a]/30 rounded-lg p-3 bg-[#0f0f0f]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[#ed565a] text-sm font-bold truncate">{b.name}</p>
                      <p className="text-[#ed565a]/60 text-[10px] font-mono truncate">{b.desc}</p>
                    </div>
                    <span className="text-[#ed565a] text-xs font-mono ml-2 whitespace-nowrap">
                      {b.pay}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
