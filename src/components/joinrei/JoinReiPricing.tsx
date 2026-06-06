import { useState } from 'react';
import { ScrollFadeIn } from './ScrollFadeIn';
import { Check } from 'lucide-react';
import solanaBadges from '@/assets/joinrei/solana-badges.png';
import iconDIY from '@/assets/pricing-diy.png';
import iconAutomated from '@/assets/pricing-automated.png';

type Interval = 'monthly' | 'yearly';

interface PricingPoint {
  price: string;
  period: string;
  perDay: string | null;
  saveNote: string | null;
}

interface Usp {
  summary: string;
  detail: string;
  worth: string;
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
  usps: Usp[];
}

const pricingTiers: PricingTier[] = [
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
      { summary: 'Skill-matched contributors', detail: 'Matched by wallet history + declared skills so your task lands in front of the right people.', worth: '$120' },
      { summary: 'Cross-platform task discovery', detail: 'Your post is discoverable across every quest platform Rei aggregates.', worth: '$90' },
      { summary: 'Visibility across quest platforms', detail: 'Reach contributors on Galxe, Zealy, QuestN, TaskOn, and Layer3.', worth: '$150' },
      { summary: 'Discovery beyond your own community', detail: 'Tap into Rei contributors who would never have found you otherwise.', worth: '$75' },
      { summary: 'Cross-chain reach', detail: 'Solana, Ethereum, Polygon, Arbitrum, and Base contributors all included.', worth: '$100' },
      { summary: 'AI-filtered relevance', detail: 'Rei filters out farmers and surfaces contributors who actually fit your task.', worth: '$60' },
      { summary: 'No contributor onboarding required', detail: 'Contributors keep using their existing quest platforms — no signup friction.', worth: '$40' },
      { summary: 'Traffic routed back to original platform', detail: 'All clicks land on your original task URL — your funnel stays intact.', worth: '$50' },
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
      { summary: 'Auto-sync of campaign tasks', detail: 'Continuous sync across Galxe, Zealy, QuestN, TaskOn, Layer3 and custom sources.', worth: '$400' },
      { summary: 'API ingestion', detail: 'Drop a link — Rei keeps the task fresh and re-indexed automatically.', worth: '$250' },
      { summary: 'Auto-categorisation', detail: 'Tasks are tagged by skill, chain, and payout type so matching stays sharp.', worth: '$220' },
      { summary: 'Continuous skill-matched distribution', detail: 'Always-on matching to skill-aligned wallets through AskRei + Agent Rei.', worth: '$300' },
      { summary: 'Cross-chain reach', detail: 'Solana, Ethereum, Polygon, Arbitrum, and Base contributors all included.', worth: '$200' },
      { summary: 'Reduced contributor overlap', detail: 'Priority freshness rotation ensures the same contributors are not spammed.', worth: '$180' },
      { summary: 'Performance insights', detail: 'See tasks indexed, sync cycles, and last sync timestamps in real time.', worth: '$150' },
      { summary: 'Monthly or yearly billing', detail: 'Switch any time — yearly plan saves 15.9% vs monthly.', worth: '$120' },
      { summary: 'Lower effective cost per task', detail: 'Unlimited posting drives your per-task amplification cost toward zero.', worth: '$90' },
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

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
          {pricingTiers.map((tier, index) => {
            const isPremium = tier.premium;
            const isAutomated = tier.nameAccent === 'Automated';
            const isUnlimited = isAutomated;

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
                  {/* HEADER */}
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
                        if (isUnlimited) {
                          window.location.href = `/unlimited-posts?interval=${interval}`;
                        } else if (tier.bookCall) {
                          window.open('https://calendly.com/wayneanthonyd-thepipegdao/join-rei', '_blank');
                        } else {
                          window.location.href = '/rei';
                        }
                      }}
                    >
                      {isUnlimited ? 'Start Subscription' : 'Get Started'}
                    </button>

                    {tier.showSolanaBadges && (
                      <div className="flex justify-center mt-4">
                        <img src={solanaBadges} alt="Solana Pay & x402" className="h-6 w-auto object-contain opacity-80" />
                      </div>
                    )}
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
                                isPremium ? 'text-amber-500' : 'text-primary'
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
