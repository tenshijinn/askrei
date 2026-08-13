import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollVideoHero } from '@/components/joinrei/ScrollVideoHero';
import { HomeValueProp } from '@/components/joinrei/HomeValueProp';
import { HomeAggregation } from '@/components/joinrei/HomeAggregation';
import { HomeDemoSection } from '@/components/joinrei/HomeDemoSection';
import { HomeReferral } from '@/components/joinrei/HomeReferral';
import { HomeAgentTabs } from '@/components/joinrei/HomeAgentTabs';
import { HomeDiamondScore } from '@/components/joinrei/HomeDiamondScore';

const JoinReiV2 = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('ask');
    if (raw) navigate(`/ask?ask=${raw}`, { replace: true });
  }, [navigate]);
  return (
    <div className="rei-theme h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-[#0a0a0a]">
      <ScrollVideoHero />
      <HomeValueProp />
      <HomeAggregation />
      <HomeDemoSection />
      <HomeAgentTabs />
      <HomeDiamondScore />
      <HomeReferral />
    </div>
  );
};

export default JoinReiV2;
