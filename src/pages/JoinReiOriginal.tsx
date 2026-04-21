import { JoinReiHero } from '@/components/joinrei/JoinReiHero';
import { JoinReiValueProp } from '@/components/joinrei/JoinReiValueProp';
import { JoinReiAggregation } from '@/components/joinrei/JoinReiAggregation';
import { JoinReiHowItWorks } from '@/components/joinrei/JoinReiHowItWorks';
import { JoinReiDemoSection } from '@/components/joinrei/JoinReiDemoSection';
import { JoinReiChatDemo } from '@/components/joinrei/JoinReiChatDemo';
import { JoinReiReferral } from '@/components/joinrei/JoinReiReferral';
import { JoinReiPricing } from '@/components/joinrei/JoinReiPricing';
import { JoinReiFlowDiagram } from '@/components/joinrei/JoinReiFlowDiagram';
import { LogoBar } from '@/components/joinrei/LogoBar';

const JoinReiOriginal = () => {
  return (
    <div className="rei-theme h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-[#0a0a0a]">
      <JoinReiHero />
      <LogoBar />
      <JoinReiChatDemo />
      <JoinReiValueProp />
      <JoinReiAggregation />
      <JoinReiDemoSection />
      <JoinReiHowItWorks />
      <JoinReiFlowDiagram />
      <JoinReiReferral />
      <JoinReiPricing />
    </div>
  );
};

export default JoinReiOriginal;
