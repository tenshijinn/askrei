import { ScrollVideoHero } from '@/components/joinrei/ScrollVideoHero';
import { HomeAggregation } from '@/components/joinrei/HomeAggregation';
import { HomeDemoSection } from '@/components/joinrei/HomeDemoSection';
import { HomeReferral } from '@/components/joinrei/HomeReferral';
import { HomeAgentChatbot } from '@/components/joinrei/HomeAgentChatbot';
import { LogoBar } from '@/components/joinrei/LogoBar';

const JoinReiV2 = () => {
  return (
    <div className="rei-theme bg-[#0a0a0a]">
      {/* Combined scrollable left + sticky scrubbing video on right */}
      <ScrollVideoHero />

      {/* Remaining sections — full width, unchanged */}
      <LogoBar />
      <HomeAggregation />
      <HomeDemoSection />
      <HomeAgentChatbot />
      <HomeReferral />
    </div>
  );
};

export default JoinReiV2;
