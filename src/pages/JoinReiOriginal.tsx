import { JoinReiHero } from '@/components/joinrei/JoinReiHero';
import { JoinReiValueProp } from '@/components/joinrei/JoinReiValueProp';
import { JoinReiAggregation } from '@/components/joinrei/JoinReiAggregation';
import { JoinReiDemoSection } from '@/components/joinrei/JoinReiDemoSection';
import { JoinReiChatDemo } from '@/components/joinrei/JoinReiChatDemo';
import { JoinReiReferral } from '@/components/joinrei/JoinReiReferral';
import { JoinReiPricing } from '@/components/joinrei/JoinReiPricing';
import { HomeVideoDemo } from '@/components/joinrei/HomeVideoDemo';
import { LogoBar } from '@/components/joinrei/LogoBar';

const JoinReiOriginal = () => {
  return (
    <div className="rei-theme h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-[#0a0a0a]">
      <JoinReiHero />
      <LogoBar />
      <JoinReiChatDemo />
      <HomeVideoDemo />
      <JoinReiValueProp />
      <JoinReiAggregation />
      <JoinReiDemoSection />
      <JoinReiReferral />
      <JoinReiPricing />
    </div>
  );
};

export default JoinReiOriginal;
