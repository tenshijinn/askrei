import { HomeHero } from '@/components/joinrei/HomeHero';
import { HomeValueProp } from '@/components/joinrei/HomeValueProp';
import { HomeAggregation } from '@/components/joinrei/HomeAggregation';
import { HomeHowItWorks } from '@/components/joinrei/HomeHowItWorks';
import { HomeDemoSection } from '@/components/joinrei/HomeDemoSection';
import { HomeChatDemo } from '@/components/joinrei/HomeChatDemo';
import { HomeReferral } from '@/components/joinrei/HomeReferral';
import { JoinReiFlowDiagram } from '@/components/joinrei/JoinReiFlowDiagram';

const JoinRei = () => {
  return (
    <div className="rei-theme h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-[#0a0a0a]">
      <HomeHero />
      <HomeChatDemo />
      <HomeValueProp />
      <HomeAggregation />
      <HomeDemoSection />
      <HomeHowItWorks />
      <JoinReiFlowDiagram />
      <HomeReferral />
    </div>
  );
};

export default JoinRei;
