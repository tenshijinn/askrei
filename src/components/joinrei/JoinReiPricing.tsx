import { ScrollFadeIn } from './ScrollFadeIn';
import { Check } from 'lucide-react';
import iconDIY from '@/assets/pricing-diy.png';
import iconAutomated from '@/assets/pricing-automated.png';

interface PricingPoint {
  price: string;
  period: string;
  perDay: string | null;
  saveNote: string | null;
  originalPrice?: string;
  betaLabel?: string;
}

interface Usp {
  summary: string;
  detail: string;
  worth: string;
}

interface PricingTier {
  name: string;
  nameAccent: string | null;
  accentStyle?: 'primary' | 'teal';
  leverage: string | null;
  subtitle: string;
  price: PricingPoint;
  icon: string;
  premium: boolean;
  totalValue: string;
  yourPrice: string;
  usps: Usp[];
}

const pricingTiers: PricingTier[] = [
  {
    name: 'AI Crypto Growth',
    nameAccent: null,
    leverage: 'Web3 Distribution Campaign',
    subtitle: 'Per Campaign',
    price: {
      price: '$500',
      period: '',
      perDay: null,
      saveNote: 'Saving ~$16,500 vs total value',
      originalPrice: '$5,000',
      betaLabel: 'Beta Launch Price',
    },
    icon: iconDIY,
    premium: false,
    totalValue: '~$17,000',
    yourPrice: '$5,000',
    usps: [
      { summary: 'Diamond Hand Score', detail: 'Rei scores users by their wallet activity and on-chain behavior to find stronger, more genuine contributors.', worth: '$2,000' },
      { summary: 'Anti-Sybil Protection', detail: 'Rei helps filter out fake, duplicate, farmed, and low-quality users before they waste your campaign budget.', worth: '$2,000' },
      { summary: 'KOL Network Activation', detail: 'We find Web3 KOLs who fit your project and can help put it in front of the right people.', worth: '$3,000' },
      { summary: 'KOL Campaign Management', detail: 'Rei handles KOL outreach, briefs, talks, and campaign setup for you.', worth: '$2,000' },
      { summary: 'AI Audience Matching', detail: 'Rei uses AI to find people and groups that best match your campaign.', worth: '$1,000' },
      { summary: 'Cross-Platform Distribution', detail: 'Your campaign is shared across multiple Web3 campaign and opportunity platforms.', worth: '$1,500' },
      { summary: 'Quest Platform Amplification', detail: 'Get your campaign in front of people already looking for Web3 campaigns and rewards.', worth: '$1,000' },
      { summary: 'Cross-Chain Reach', detail: 'Reach Web3 users across different chains, not just your own chain.', worth: '$750' },
      { summary: 'AI Relevance Filtering', detail: 'Rei filters the audience so your campaign reaches people who are more likely to care.', worth: '$500' },
      { summary: 'Beyond Your Community', detail: 'Reach new people outside your own followers and community.', worth: '$750' },
      { summary: 'No Contributor Onboarding', detail: 'Contributors do not need to join a new system before taking action.', worth: '$500' },
      { summary: 'Campaign Analytics', detail: 'See how your campaign is being shared and how people are engaging with it.', worth: '$750' },
      { summary: 'Post-Launch Amplification', detail: 'Keep your campaign moving after the first push instead of stopping after one post.', worth: '$750' },
      { summary: 'Direct Traffic Routing', detail: 'People are sent straight back to your campaign or platform.', worth: '$500' },
    ],
  },
  {
    name: 'AI Crypto Growth',
    nameAccent: '[Hyper]',
    accentStyle: 'teal',
    leverage: 'Full-Spectrum Campaign',
    subtitle: 'Per Campaign',
    price: {
      price: '$2,500',
      period: '',
      perDay: null,
      saveNote: 'Saving ~$16,750 vs total value',
      originalPrice: '$25,000',
      betaLabel: 'Beta Launch Price',
    },
    icon: iconAutomated,
    premium: false,
    totalValue: '~$41,750',
    yourPrice: '$25,000',
    usps: [
      { summary: 'Multi-Channel Ads', detail: 'Run paid campaigns across Reddit Ads, Telegram Ads, and experimental ChatGPT Ads to reach new audiences. ChatGPT Ads are Beta/Experimental and receive only a smaller share of the ad spend. This is paid advertising — it does not include access to Telegram groups or Reddit communities.', worth: '$9,000' },
      { summary: 'Diamond Hand Score', detail: 'Rei scores users by their wallet activity and on-chain behavior to find stronger, more genuine contributors.', worth: '$4,000' },
      { summary: 'Anti-Sybil Protection', detail: 'Rei helps filter out fake, duplicate, farmed, and low-quality users before they waste your campaign budget.', worth: '$4,000' },
      { summary: 'KOL Network Activation', detail: 'We find Web3 KOLs who fit your project and can help put it in front of the right people.', worth: '$5,000' },
      { summary: 'KOL Campaign Management', detail: 'Rei handles KOL outreach, briefs, talks, and campaign setup for you.', worth: '$3,500' },
      { summary: 'AI Audience Matching', detail: 'Rei uses AI to find people and groups that best match your campaign.', worth: '$2,000' },
      { summary: 'Cross-Platform Distribution', detail: 'Your campaign is shared across multiple Web3 campaign and opportunity platforms.', worth: '$1,500' },
      { summary: 'Quest Platform Amplification', detail: 'Get your campaign in front of people already looking for Web3 campaigns and rewards.', worth: '$1,500' },
      { summary: 'Cross-Chain Reach', detail: 'Reach Web3 users across different chains, not just your own chain.', worth: '$1,250' },
      { summary: 'AI Relevance Filtering', detail: 'Rei filters the audience so your campaign reaches people who are more likely to care.', worth: '$1,000' },
      { summary: 'Beyond Your Community', detail: 'Reach new people outside your own followers and community.', worth: '$1,250' },
      { summary: 'No Contributor Onboarding', detail: 'Contributors do not need to join a new system before taking action.', worth: '$750' },
      { summary: 'Campaign Analytics', detail: 'See how your campaign is being shared and how people are engaging with it.', worth: '$1,000' },
      { summary: 'Post-Launch Amplification', detail: 'Keep your campaign moving after the first push instead of stopping after one post.', worth: '$1,250' },
      { summary: 'Direct Traffic Routing', detail: 'People are sent straight back to your campaign or platform.', worth: '$750' },
    ],
  },
];

const CALENDLY_URL = 'https://calendly.com/wayneanthonyd-thepipegdao/join-rei';

export const JoinReiPricing = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary text-center mb-12">
            Packages
          </h2>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
          {pricingTiers.map((tier, index) => {
            const isTeal = tier.accentStyle === 'teal';
            const activePrice = tier.price;

            return (
              <ScrollFadeIn key={`${tier.name}-${index}`} delay={index * 100}>
                <div
                  className={`relative h-full flex flex-col rounded-2xl border-[0.5px] overflow-hidden bg-[#141414] transition-all duration-300 hover:shadow-2xl ${
                    isTeal ? 'border-cyan-400/40 hover:shadow-cyan-400/10' : 'border-white/10 hover:shadow-white/5'
                  }`}
                >
                  {/* HEADER */}
                  <div className="p-6 pb-5">
                    <div className="flex items-start gap-3 mb-5">
                      <div className="flex-shrink-0">
                        <img src={tier.icon} alt="" className="h-10 w-10 object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-light font-mono leading-snug text-primary">
                          {tier.name}
                          {tier.nameAccent && (
                            <>
                              {' '}
                              <span className={isTeal ? 'teal-glow' : 'pulse-glow'}>{tier.nameAccent}</span>
                            </>
                          )}
                        </h3>
                        {tier.leverage && (
                          <span className="block text-[10px] text-cream/50 tracking-wider mt-0.5 font-mono uppercase">
                            {tier.leverage}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="min-h-[18px] mb-1 text-center">
                      {activePrice.betaLabel && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-primary/90">
                          {activePrice.betaLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-center mb-4">
                      <div className={`text-5xl font-light font-mono ${isTeal ? 'text-cyan-300' : 'text-cream'}`}>
                        {activePrice.price}
                      </div>
                      {activePrice.originalPrice && (
                        <div className="mt-1 text-xl font-mono text-cream/40 line-through decoration-cream/40">
                          {activePrice.originalPrice}
                        </div>
                      )}
                      {activePrice.saveNote && (
                        <p className="mt-1 text-[10px] text-cream/50 font-mono">{activePrice.saveNote}</p>
                      )}
                    </div>


                    <button
                      className={`w-full font-mono py-2.5 rounded-full transition-all duration-300 text-sm ${
                        isTeal
                          ? 'bg-cyan-400 text-[#0a0a0a] hover:bg-cyan-300'
                          : 'btn-manga btn-manga-primary'
                      }`}
                      onClick={() => window.open(CALENDLY_URL, '_blank')}
                    >
                      Book a Call
                    </button>
                  </div>

                  {/* FEATURES */}
                  <div className="border-t border-white/5 p-6 flex-1 flex flex-col">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-mono text-cream/50 mb-1">
                      {tier.subtitle}
                    </p>
                    <p className="text-[11px] text-cream/60 font-mono mb-4">What's included</p>

                    <div className="space-y-2 flex-1">
                      {tier.usps.map((usp, uspIndex) => (
                        <div
                          key={uspIndex}
                          className="group rounded-md -mx-2 px-2 py-1 hover:bg-white/[0.03] transition-colors cursor-default"
                        >
                          <div className="flex items-start gap-2.5">
                            <Check
                              className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${
                                isTeal ? 'text-cyan-300' : 'text-primary'
                              }`}
                            />
                            <span className="text-cream/85 text-xs font-mono leading-relaxed flex-1">
                              {usp.summary}
                            </span>
                            <span className="text-[10px] font-mono text-cream/40 flex-shrink-0">{usp.worth}</span>
                          </div>
                          <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                            <div className="overflow-hidden">
                              <p className="pl-6 pr-2 pt-1 text-[10.5px] font-mono text-cream/60 leading-relaxed">
                                {usp.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-cream/60 text-[11px] font-mono uppercase tracking-wider">Total Value</span>
                      <span className={`text-base font-light font-mono ${isTeal ? 'text-cyan-300' : 'text-primary'}`}>
                        {tier.totalValue}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 flex items-center justify-between">
                      <span className="text-cream/60 text-[11px] font-mono uppercase tracking-wider">Your Price</span>
                      <span className={`text-base font-light font-mono ${isTeal ? 'text-cyan-300' : 'text-primary'}`}>
                        {tier.yourPrice}
                      </span>
                    </div>

                  </div>
                </div>
              </ScrollFadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
};
