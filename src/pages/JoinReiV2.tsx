import { ScrollVideoHero } from '@/components/joinrei/ScrollVideoHero';
import { HomeValueProp } from '@/components/joinrei/HomeValueProp';
import { HomeAggregation } from '@/components/joinrei/HomeAggregation';
import { HomeDemoSection } from '@/components/joinrei/HomeDemoSection';
import { HomeReferral } from '@/components/joinrei/HomeReferral';
import { HomeAgentChatbot } from '@/components/joinrei/HomeAgentChatbot';

const JoinReiV2 = () => {
  return (
    <div className="rei-theme h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-[#0a0a0a]">
      <ScrollVideoHero />
      <HomeValueProp />
      <HomeAggregation />
      <HomeDemoSection />
      <HomeAgentChatbot />
      <HomeReferral />
    </div>
  );
};

export default JoinReiV2;
