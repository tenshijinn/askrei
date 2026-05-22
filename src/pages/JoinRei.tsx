import { HomeHero } from '@/components/joinrei/HomeHero';
import { HomeValueProp } from '@/components/joinrei/HomeValueProp';
import { HomeAggregation } from '@/components/joinrei/HomeAggregation';
import { HomeDemoSection } from '@/components/joinrei/HomeDemoSection';
import { HomeChatDemo } from '@/components/joinrei/HomeChatDemo';
import { HomeReferral } from '@/components/joinrei/HomeReferral';
import { LogoBar } from '@/components/joinrei/LogoBar';

const JoinRei = () => {
  return (
    <div className="rei-theme h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-[#0a0a0a]">
      <HomeHero />
      <LogoBar />
      <HomeChatDemo />
      <HomeValueProp />
      <HomeAggregation />
      <HomeDemoSection />
      <HomeReferral />
    </div>
  );
};

export default JoinRei;
