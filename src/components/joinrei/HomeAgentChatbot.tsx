import { ScrollFadeIn } from './ScrollFadeIn';
import agentImg from '@/assets/joinrei/ai-agent.png';
import mockupImg from '@/assets/joinrei/app-mockup.png';

const bankGothic = {
  fontFamily: '"Bank Gothic", "Bank Gothic Medium BT", "Copperplate Gothic Bold", "Trade Gothic", "Arial Black", sans-serif',
  letterSpacing: '0.222em',
  lineHeight: 0.5,
  textTransform: 'uppercase' as const,
};

export const HomeAgentChatbot = () => {
  return (
    <section className="min-h-screen snap-start relative flex overflow-hidden">
      {/* Left — Agent */}
      <div className="w-1/2 relative flex flex-col justify-between p-10 lg:p-16" style={{ backgroundColor: '#faf1e1' }}>
        <ScrollFadeIn>
          <h2
            className="text-[2.5rem] md:text-[3rem] lg:text-[4rem] font-bold text-[#0a0a0a]"
            style={bankGothic}
          >
            Agent
          </h2>
        </ScrollFadeIn>

        <div className="flex-1 flex items-center justify-center py-8">
          <img
            src={agentImg}
            alt="Rei autonomous agent"
            className="max-h-[70vh] w-auto object-contain"
          />
        </div>

        <ScrollFadeIn delay={150}>
          <div className="font-mono text-[0.8rem] md:text-sm text-[#0a0a0a]/80 leading-relaxed max-w-md space-y-1">
            <p>&gt; Autonomous worker scanning Galxe, QuestN & Superteam 24/7.</p>
            <p>&gt; Filters bounties by your skills, wallet & reputation.</p>
            <p>&gt; Surfaces only the gigs that actually pay you.</p>
            <p>&gt; Zero scrolling. Zero noise. Pure earn signal.</p>
          </div>
        </ScrollFadeIn>
      </div>

      {/* Right — Chatbot */}
      <div className="w-1/2 relative flex flex-col justify-between p-10 lg:p-16 bg-[#0a0a0a]">
        <ScrollFadeIn>
          <h2
            className="text-[2.5rem] md:text-[3rem] lg:text-[4rem] font-bold text-cream"
            style={bankGothic}
          >
            <span className="block">Chatbot</span>
            <span className="block mt-[0.6em]">Chatbot</span>
          </h2>
        </ScrollFadeIn>

        <div className="flex-1 flex items-center justify-center py-8">
          <img
            src={mockupImg}
            alt="Rei chatbot bounty results"
            className="max-h-[70vh] w-auto object-contain drop-shadow-2xl"
          />
        </div>

        <ScrollFadeIn delay={150}>
          <div className="font-mono text-[0.8rem] md:text-sm text-cream/80 leading-relaxed max-w-md space-y-1">
            <p>&gt; Just ask: "bounties this week paying over $100."</p>
            <p>&gt; Rei replies in seconds with matched, ranked quests.</p>
            <p>&gt; Tap a card → claim the bounty → start earning SOL.</p>
            <p>&gt; Your personal bounty concierge, always on.</p>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
