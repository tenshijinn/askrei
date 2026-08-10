import { JoinReiHero } from '@/components/joinrei/JoinReiHero';
import { JoinReiValueProp } from '@/components/joinrei/JoinReiValueProp';

import { JoinReiCrossChain } from '@/components/joinrei/JoinReiCrossChain';
import { JoinReiDiamondScore } from '@/components/joinrei/JoinReiDiamondScore';
import { JoinReiDemoSection } from '@/components/joinrei/JoinReiDemoSection';
import { JoinReiChatDemo } from '@/components/joinrei/JoinReiChatDemo';
import { JoinReiCampaignTracking } from '@/components/joinrei/JoinReiCampaignTracking';
import { JoinReiReferral } from '@/components/joinrei/JoinReiReferral';
import { JoinReiPricing } from '@/components/joinrei/JoinReiPricing';
import { HomeVideoDemo } from '@/components/joinrei/HomeVideoDemo';

const JoinReiOriginal = () => {
  return (
    <div className="rei-theme h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-[#0a0a0a]">
      <JoinReiHero />
      <JoinReiChatDemo />
      <JoinReiValueProp />
      <JoinReiCampaignTracking />
      <HomeVideoDemo />
      <JoinReiCrossChain />
      <JoinReiDiamondScore />
      <JoinReiDemoSection />
      <JoinReiReferral />
      <JoinReiPricing />
    </div>
  );
};

export default JoinReiOriginal;

