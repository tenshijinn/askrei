import { ScrollFadeIn } from './ScrollFadeIn';
import { Eye, Zap, Rocket, Check } from 'lucide-react';
import solanaBadges from '@/assets/joinrei/solana-badges.png';

const pricingTiers = [
  {
    name: 'Posts',
    price: '$5',
    period: 'Per Post',
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
    name: 'Unlimited Posts',
    price: '$99',
    period: '30 days',
    icon: Zap,
    premium: false,
    showSolanaBadges: false,
    bookCall: true,
    positioning: 'Always-on distribution for teams running continuous tasks.',
    totalValue: '~$2,010',
    usps: [
      { feature: 'Unlimited task amplification', worth: '$400' },
      { feature: 'API-based ingestion (no manual posting)', worth: '$250' },
      { feature: 'Skill-matched contributors (wallet + declared skills)', worth: '$180' },
      { feature: 'Ongoing visibility on Galxe, Zealy, QuestN, TaskOn, Layer3', worth: '$300' },
      { feature: 'Extended cross-chain reach', worth: '$200' },
      { feature: 'Continuous cross-community discovery', worth: '$150' },
      { feature: 'Reduced contributor overlap', worth: '$120' },
      { feature: 'Priority task freshness', worth: '$100' },
      { feature: 'Basic task performance insights', worth: '$90' },
      { feature: 'Lower effective cost per task', worth: '$120' },
    ],
  },
  {
    name: 'Rocket Reach',
    price: '$2,500',
    period: 'Per Campaign',
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
            return (
              <ScrollFadeIn key={tier.name} delay={index * 100}>
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

                  <h3 className={`text-xl font-light font-mono mb-1 text-center ${isPremium ? 'text-amber-500' : 'text-primary'}`}>
                    {tier.name}
                  </h3>

                  <div className="text-center mb-1">
                    <span className={`text-3xl font-light font-mono ${isPremium ? 'text-amber-500' : 'text-cream'}`}>
                      {tier.price}
                    </span>
                  </div>

                  <p className="text-cream/60 font-mono text-sm text-center mb-3">{tier.period}</p>

                  <p className="text-cream/80 text-sm text-center mb-4 font-mono leading-relaxed">
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
                      if (tier.name === 'Rocket Reach') {
                        window.location.href = '/rocket-reach';
                      } else if (tier.bookCall) {
                        window.open('https://calendly.com/wayneanthonyd-thepipegdao/join-rei', '_blank');
                      } else {
                        window.location.href = '/rei';
                      }
                    }}
                  >
                    {tier.name === 'Rocket Reach' ? 'Launch Campaign' : tier.bookCall ? 'Book a Call' : 'Get Started'}
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