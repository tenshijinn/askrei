import { useState } from 'react';
import { ScrollFadeIn } from './ScrollFadeIn';
import { Check } from 'lucide-react';
import solanaBadges from '@/assets/joinrei/solana-badges.png';
import iconRocket from '@/assets/pricing-rocket.png';
import iconDIY from '@/assets/pricing-diy.png';
import iconAutomated from '@/assets/pricing-automated.png';

type Interval = 'monthly' | 'yearly';

interface PricingPoint {
  price: string;
  period: string;
  perDay: string | null;
  saveNote: string | null;
}

interface PricingTier {
  name: string;
  nameAccent: string | null;
  leverage: string | null;
  subtitle: string;
  prices: { monthly: PricingPoint; yearly?: PricingPoint };
  hasToggle: boolean;
  icon: string;
  premium: boolean;
  bookCall: boolean;
  showSolanaBadges?: boolean;
  positioning: string;
  totalValue: string;
  usps: { feature: string; worth: string }[];
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Rocket Reach Community Growth Engine',
    nameAccent: null,
    leverage: 'x100 Leverage User Growth',
    subtitle: '1 Promotion Campaign',
    prices: {
      monthly: { price: '$2,500', period: 'Per Campaign', perDay: null, saveNote: null },
    },
    hasToggle: false,
    icon: iconRocket,
    premium: true,
    bookCall: true,
    positioning: 'Paid amplification for launches, campaigns, and time-sensitive pushes.',
    totalValue: '~$4,900',
    usps: [
      { feature: 'Guaranteed paid reach (defined wallet/contributor impressions)', worth: '$2,000' },
      { feature: 'Promoted placement across Rei discovery surfaces', worth: '$800' },
      { feature: 'Skill-matched contributors (wallet + declared skills)', worth: '$300' },
      { feature: 'Visibility on Galxe, Zealy, QuestN, TaskOn, Layer3', worth: '$600' },
      { feature: 'Expanded cross-chain reach', worth: '$400' },
      { feature: 'Time-boxed amplification (ideal for launches)', worth: '$250' },
      { feature: 'Campaign-level reporting', worth: '$200' },
      { feature: 'Optional message framing support', worth: '$150' },
      { feature: 'Priority routing during campaign window', worth: '$200' },
    ],
  },
  {
    name: 'DIY Community Growth Engine',
    nameAccent: null,
    leverage: 'x10 Leverage User Growth',
    subtitle: '1 Promotion Post',
    prices: {
      monthly: { price: '$5', period: 'Per Post', perDay: null, saveNote: null },
    },
    hasToggle: false,
    icon: iconDIY,
    premium: false,
    bookCall: false,
    showSolanaBadges: false,
    positioning: 'One-off task amplification to relevant Web3 contributors.',
    totalValue: '~$685',
    usps: [
      { feature: 'Skill-matched contributors (wallet + declared skills)', worth: '$120' },
      { feature: 'Cross-platform task discovery', worth: '$90' },
      { feature: 'Visibility to contributors on Galxe, Zealy, QuestN, TaskOn, Layer3', worth: '$150' },
      { feature: 'Discovery beyond your own community', worth: '$75' },
      { feature: 'Cross-chain reach (Solana, Ethereum, Polygon, Arbitrum, Base)', worth: '$100' },
      { feature: 'AI-filtered relevance', worth: '$60' },
      { feature: 'No contributor onboarding required', worth: '$40' },
      { feature: 'Traffic routed back to original task platform', worth: '$50' },
    ],
  },
  {
    name: 'Community Growth Engine',
    nameAccent: 'Automated',
    leverage: 'x10 Leverage User Growth',
    subtitle: 'Unlimited Promotion Posts',
    prices: {
      monthly: { price: '$99', period: 'p/m', perDay: 'Just $3.30 per day', saveNote: null },
      yearly: { price: '$999', period: 'p/y', perDay: 'Just $2.73 per day', saveNote: 'Save 15.9% vs monthly' },
    },
    hasToggle: true,
    icon: iconAutomated,
    premium: false,
    bookCall: false,
    positioning: 'Always-on distribution for teams running continuous tasks.',
    totalValue: '~$2,010',
    usps: [
      { feature: 'Auto-sync & re-sync of campaign tasks (Galxe, Zealy, QuestN, TaskOn, Layer3, custom)', worth: '$400' },
      { feature: 'API ingestion — drop a link, Rei keeps it fresh', worth: '$250' },
      { feature: 'Auto-categorisation by skill, chain & payout type', worth: '$220' },
      { feature: 'Continuous matching to skill-aligned wallets via AskRei + Agent Rei', worth: '$300' },
      { feature: 'Cross-chain reach (Solana, Ethereum, Polygon, Arbitrum, Base)', worth: '$200' },
      { feature: 'Reduced contributor overlap & priority freshness', worth: '$180' },
      { feature: 'Performance insights — tasks indexed, sync cycles, last sync', worth: '$150' },
      { feature: 'Monthly or yearly billing — yearly saves 15.9%', worth: '$120' },
      { feature: 'Lower effective cost per task', worth: '$90' },
    ],
  },
];

export const JoinReiPricing = () => {
  const [intervals, setIntervals] = useState<Record<number, Interval>>({});

  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary text-center mb-12">
            Packages
          </h2>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-stretch">
          {pricingTiers.map((tier, index) => {
            const isPremium = tier.premium;
            const isAutomated = tier.nameAccent === 'Automated';
            const isUnlimited = isAutomated;
            const isRocketReach = tier.name === 'Rocket Reach';

            const interval: Interval = intervals[index] ?? 'monthly';
            const activePrice =
              tier.hasToggle && interval === 'yearly' && tier.prices.yearly
                ? tier.prices.yearly
                : tier.prices.monthly;

            return (
              <ScrollFadeIn key={`${tier.name}-${index}`} delay={index * 100}>
                <div
                  className={`relative h-full flex flex-col rounded-2xl border-[0.5px] overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                    isPremium
                      ? 'border-amber-500/40 bg-[#141414] hover:shadow-amber-500/10'
                      : 'border-white/10 bg-[#141414] hover:shadow-white/5'
                  }`}
                >
                  {/* ── HEADER ─────────────────────────────────────────────── */}
                  <div className="p-6 pb-5">
                    <div className="flex items-start gap-3 mb-5">
                      <div className="flex-shrink-0">
                        <img src={tier.icon} alt="" className="h-10 w-10 object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-base font-light font-mono leading-snug ${
                            isPremium ? 'text-amber-500' : 'text-primary'
                          }`}
                        >
                          {tier.nameAccent && (
                            <>
                              <span className="pulse-glow">{tier.nameAccent}</span>{' '}
                            </>
                          )}
                          {tier.name}
                        </h3>
                        {tier.leverage && (
                          <span className="block text-[10px] text-cream/50 tracking-wider mt-0.5 font-mono">
                            {tier.leverage}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle (or spacer) — fixed height to keep prices aligned */}
                    {tier.hasToggle && tier.prices.yearly ? (
                      <div className="inline-grid grid-cols-2 gap-1 p-1 rounded-full border border-white/10 bg-[#0f0f0f] mb-4">
                        {(['monthly', 'yearly'] as Interval[]).map((opt) => {
                          const active = interval === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIntervals((prev) => ({ ...prev, [index]: opt }));
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-mono transition-all ${
                                active ? 'bg-primary text-[#0a0a0a] font-medium' : 'text-cream/60 hover:text-cream'
                              }`}
                            >
                              {opt === 'monthly' ? 'Monthly' : 'Yearly'}
                              {opt === 'yearly' && (
                                <span
                                  className={`ml-1 px-1 py-0.5 rounded-full text-[8px] ${
                                    active ? 'bg-[#0a0a0a]/20 text-[#0a0a0a]' : 'bg-primary/20 text-primary'
                                  }`}
                                >
                                  -15.9%
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div aria-hidden className="mb-4 h-[30px]" />
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        className={`text-4xl font-light font-mono ${isPremium ? 'text-amber-500' : 'text-cream'}`}
                      >
                        {activePrice.price}
                      </span>
                      <span className="text-cream/60 font-mono text-xs">{activePrice.period}</span>
                    </div>

                    <div className="min-h-[18px] mb-3">
                      {activePrice.perDay && (
                        <p className="text-[11px] text-primary/90 font-mono">{activePrice.perDay}</p>
                      )}
                      {activePrice.saveNote && (
                        <p className="text-[10px] text-cream/50 font-mono">{activePrice.saveNote}</p>
                      )}
                    </div>

                    <p className="text-cream/70 text-xs font-mono leading-relaxed mb-5">{tier.positioning}</p>

                    <button
                      className={`w-full font-mono py-2.5 rounded-full transition-all duration-300 text-sm ${
                        isPremium
                          ? 'bg-amber-500 text-[#0a0a0a] hover:bg-amber-400'
                          : 'btn-manga btn-manga-primary'
                      }`}
                      onClick={() => {
                        if (isRocketReach) {
                          window.location.href = '/rocket-reach';
                        } else if (isUnlimited) {
                          if (interval === 'yearly') {
                            window.location.href = '/unlimited-posts?interval=yearly';
                          } else {
                            window.location.href = '/rocket-reach';
                          }
                        } else if (tier.bookCall) {
                          window.open('https://calendly.com/wayneanthonyd-thepipegdao/join-rei', '_blank');
                        } else {
                          window.location.href = '/rei';
                        }
                      }}
                    >
                      {isRocketReach ? 'Launch Campaign' : isUnlimited ? 'Start Subscription' : 'Get Started'}
                    </button>

                    {tier.showSolanaBadges && (
                      <div className="flex justify-center mt-4">
                        <img src={solanaBadges} alt="Solana Pay & x402" className="h-6 w-auto object-contain opacity-80" />
                      </div>
                    )}
                  </div>

                  {/* ── FEATURES ───────────────────────────────────────────── */}
                  <div className="border-t border-white/5 p-6 flex-1 flex flex-col">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-mono text-cream/50 mb-1">
                      {tier.subtitle}
                    </p>
                    <p className="text-[11px] text-cream/60 font-mono mb-4">What's included</p>

                    <div className="space-y-3 flex-1">
                      {tier.usps.map((usp, uspIndex) => (
                        <div key={uspIndex} className="flex items-start gap-2.5">
                          <Check
                            className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${
                              isPremium ? 'text-amber-500' : 'text-primary'
                            }`}
                          />
                          <span className="text-cream/85 text-xs font-mono leading-relaxed flex-1">
                            {usp.feature}
                          </span>
                          <span className="text-[10px] font-mono text-cream/40 flex-shrink-0">{usp.worth}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-cream/60 text-[11px] font-mono uppercase tracking-wider">Total Value</span>
                      <span className={`text-base font-light font-mono ${isPremium ? 'text-amber-500' : 'text-primary'}`}>
                        {tier.totalValue}
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
