import { ScrollVideoHero } from '@/components/joinrei/ScrollVideoHero';
import { HomeValueProp } from '@/components/joinrei/HomeValueProp';
import { HomeAggregation } from '@/components/joinrei/HomeAggregation';
import { HomeDemoSection } from '@/components/joinrei/HomeDemoSection';
import { HomeReferral } from '@/components/joinrei/HomeReferral';
import { HomeAgentChatbot } from '@/components/joinrei/HomeAgentChatbot';

const JoinReiV2 = () => {
  return (
    <div className="rei-theme bg-[#0a0a0a]">
      {/* Combined: left scrolls through hero → logos → how-it-works; right is sticky scrubbing video */}
      <ScrollVideoHero />

      {/* Earn Points & Rewards — own full-width parallax */}
      <HomeValueProp />

      {/* Remaining sections — unchanged */}
      <HomeAggregation />
      <HomeDemoSection />
      <HomeAgentChatbot />
      <HomeReferral />
    </div>
  );
};

export default JoinReiV2;
