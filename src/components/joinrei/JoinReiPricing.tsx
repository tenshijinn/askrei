import { ScrollFadeIn } from './ScrollFadeIn';
import { Eye, Zap, Rocket, Check } from 'lucide-react';
import solanaBadges from '@/assets/joinrei/solana-badges.png';

const pricingTiers = [
  {
    name: 'Community Growth Engine',
    nameAccent: null as string | null,
    leverage: 'x10 Leverage',
    subtitle: '1 Promotion Post',
    price: '$5',
    period: 'Per Post',
    perDay: null as string | null,
    saveNote: null as string | null,
    icon: Eye,
    premium: false,
    showSolanaBadges: true,
    bookCall: false,
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
    leverage: 'x10 Leverage',
    subtitle: 'Unlimited Promotion Posts',
    price: '$99',
    period: 'p/m or $999 p/y',
    perDay: 'Just $3.30/day · or $2.73/day yearly',
    saveNote: 'Yearly saves 15.9%',
    icon: Zap,
    premium: false,
    showSolanaBadges: false,
    bookCall: true,
    positioning: 'Always-on distribution for teams running continuous tasks.',
    totalValue: '~$2,010',
    usps: [
      { feature: 'Auto-scrape & re-sync of campaign tasks (Galxe, Zealy, QuestN, TaskOn, Layer3, custom)', worth: '$400' },
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
  {
    name: 'Rocket Reach',
    nameAccent: null as string | null,
    leverage: null as string | null,
    subtitle: 'Community Growth Engine x100 Leverage',
    price: '$2,500',
    period: 'Per Campaign',
    perDay: null as string | null,
    saveNote: null as string | null,
    icon: Rocket,
    premium: true,
    showSolanaBadges: false,
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
  }
];

export const JoinReiPricing = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary text-center mb-12">
            Packages
          </h2>
        </ScrollFadeIn>

        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {pricingTiers.map((tier, index) => {
            const isPremium = tier.premium;
            const isAutomated = tier.nameAccent === 'Automated';
            const isUnlimited = isAutomated; // tier 2 = the unlimited subscription
            const isRocketReach = tier.name === 'Rocket Reach';
            return (
              <ScrollFadeIn key={`${tier.name}-${index}`} delay={index * 100}>
                <div className={`relative h-full flex flex-col p-6 rounded-2xl border-[0.5px] transition-all duration-300 hover:shadow-2xl ${
                  isPremium 
                    ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent hover:shadow-amber-500/10' 
                    : 'border-white/10 bg-[#141414] hover:shadow-white/5'
                }`}>
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-2xl border-[0.5px] ${
                      isPremium ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'
                    }`}>
                      <tier.icon className={`h-8 w-8 ${isPremium ? 'text-amber-500' : 'text-primary'}`} />
                    </div>
                  </div>

                  <h3 className={`text-lg lg:text-xl font-light font-mono mb-1 text-center leading-snug ${isPremium ? 'text-amber-500' : 'text-primary'}`}>
                    {tier.nameAccent && (
                      <>
                        <span className="pulse-glow">{tier.nameAccent}</span>{' '}
                      </>
                    )}
                    {tier.name}
                    {tier.leverage && (
                      <span className="block text-[11px] text-cream/50 tracking-wider mt-1">{tier.leverage}</span>
                    )}
                  </h3>

                  <p className="text-[11px] text-center text-cream/70 font-mono mb-3 italic">
                    {tier.subtitle}
                  </p>

                  <div className="text-center mb-1">
                    <span className={`text-3xl font-light font-mono ${isPremium ? 'text-amber-500' : 'text-cream'}`}>
                      {tier.price}
                    </span>
                  </div>

                  <p className="text-cream/60 font-mono text-sm text-center mb-1">{tier.period}</p>

                  {tier.perDay && (
                    <p className="text-[11px] text-center text-primary/90 font-mono mb-1">
                      {tier.perDay}
                    </p>
                  )}
                  {tier.saveNote && (
                    <p className="text-[10px] text-center text-cream/50 font-mono mb-2">
                      {tier.saveNote}
                    </p>
                  )}

                  <p className="text-cream/80 text-sm text-center mb-4 mt-2 font-mono leading-relaxed">
                    {tier.positioning}
                  </p>

                  {tier.showSolanaBadges && (
                    <div className="flex justify-center mb-4">
                      <img src={solanaBadges} alt="Solana Pay & x402" className="h-7 w-auto object-contain" />
                    </div>
                  )}

                  <div className="flex-1 mb-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                      {tier.usps.map((usp, uspIndex) => (
                        <div key={uspIndex} className="flex items-start gap-2">
                          <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isPremium ? 'text-amber-500' : 'text-primary'}`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-cream/90 text-xs font-mono leading-tight block">{usp.feature}</span>
                            <span className={`text-xs font-mono ${isPremium ? 'text-amber-400' : 'text-primary'}`}>
                              Worth {usp.worth}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-xl p-3 mb-4 ${isPremium ? 'bg-amber-500/10' : 'bg-white/5'}`}>
                    <p className="text-center font-mono">
                      <span className="text-cream/60 text-xs">Total Value: </span>
                      <span className={`text-lg font-light ${isPremium ? 'text-amber-500' : 'text-primary'}`}>{tier.totalValue}</span>
                    </p>
                  </div>

                  <button 
                    className={`w-full font-mono py-3 rounded-full transition-all duration-300 text-sm ${
                      isPremium 
                        ? 'bg-amber-500 text-[#0a0a0a] hover:bg-amber-400' 
                        : 'btn-manga btn-manga-primary w-full'
                    }`}
                    onClick={() => {
                      if (isRocketReach) {
                        window.location.href = '/rocket-reach';
                      } else if (isUnlimited) {
                        window.location.href = '/unlimited-posts';
                      } else if (tier.bookCall) {
                        window.open('https://calendly.com/wayneanthonyd-thepipegdao/join-rei', '_blank');
                      } else {
                        window.location.href = '/rei';
                      }
                    }}
                  >
                    {isRocketReach ? 'Launch Campaign' : isUnlimited ? 'Start Subscription' : 'Get Started'}
                  </button>
                </div>
              </ScrollFadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
};