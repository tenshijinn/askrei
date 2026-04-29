import { AgentsHero } from '@/components/agents/AgentsHero';
import { AgentsValueProp } from '@/components/agents/AgentsValueProp';
import { AgentsEndpoints } from '@/components/agents/AgentsEndpoints';
import { AgentsHowItWorks } from '@/components/agents/AgentsHowItWorks';
import { AgentsCodeDemo } from '@/components/agents/AgentsCodeDemo';
import { AgentsCompliance } from '@/components/agents/AgentsCompliance';
import { AgentsPricing } from '@/components/agents/AgentsPricing';
import { LogoBar } from '@/components/joinrei/LogoBar';
import { useEffect } from 'react';

const Agents = () => {
  useEffect(() => {
    document.title = 'Rei for Agents — Read-only Web3 task feed for AI agents';
    const meta = document.querySelector('meta[name="description"]');
    const desc = 'Plug your AI agent into the largest cross-chain index of Web3 tasks, jobs and bounties. Pay per call in SOL via x402. Read-only, public data, zero scraping.';
    if (meta) meta.setAttribute('content', desc);
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="rei-theme h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-[#0a0a0a]">
      <AgentsHero />
      <LogoBar />
      <AgentsValueProp />
      <AgentsEndpoints />
      <AgentsHowItWorks />
      <AgentsCodeDemo />
      <AgentsCompliance />
      <AgentsPricing />
    </div>
  );
};

export default Agents;
