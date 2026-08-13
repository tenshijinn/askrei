import { ScrollFadeIn } from './ScrollFadeIn';

const POINTS = [
  {
    title: 'How You Hold',
    body: 'We look at how long you keep your tokens. If you hold and do not dump, your score goes up.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
        <path d="M12 2l8 6-8 14-8-14 8-6z" />
      </svg>
    ),
  },
  {
    title: 'How You Join In',
    body: 'We look at how you take part in real communities across chains and platforms, not just one quick farm.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
      </svg>
    ),
  },
  {
    title: 'Real People Only',
    body: 'Bots and fake wallets get a low score. That means more bounties and airdrops are left for real people like you.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

const BREAKDOWN = [
  { label: 'Community', value: 82 },
  { label: 'Confidence', value: 74 },
  { label: 'Trust', value: 66 },
];

const WalletChip = ({ net, addr }: { net: string; addr: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161618] px-2 py-1 text-[10px] font-mono text-cream/70">
    <span className="rounded bg-[#2a2a2c] px-1.5 py-0.5 text-[8px] tracking-wider text-cream/60">{net}</span>
    {addr}
  </span>
);

/** Static mockup of a bounty seeker's own Diamond Score card. */
const ScoreMockup = () => (
  <div className="w-full rounded-2xl border-[0.5px] border-white/10 bg-[#111112] p-5">
    <div className="mb-4 flex items-center justify-between">
      <span className="text-sm font-semibold text-cream">Your Diamond Hand Score</span>
      <span className="text-[11px] text-[#e8b4a0]">Sapphire</span>
    </div>

    <div className="mb-4 flex items-center gap-4 rounded-xl border border-white/10 bg-[#131315] p-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#221f1e] text-base font-semibold text-[#e8b4a0]">
        73
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-cream">73</span>
          <span className="text-[10px] text-cream/40">/100</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <WalletChip net="SOL" addr="xDb6…TJN6" />
          <WalletChip net="EVM" addr="0x45…189f" />
        </div>
      </div>
    </div>

    <div className="space-y-3">
      {BREAKDOWN.map((b) => (
        <div key={b.label}>
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="text-cream/50">{b.label}</span>
            <span className="text-cream/80">{b.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#1d1d1f]">
            <div className="h-full rounded-full bg-[#e8b4a0]" style={{ width: `${b.value}%` }} />
          </div>
        </div>
      ))}
    </div>

    <div className="mt-4 rounded-xl border border-white/10 bg-[#0d0d0e] px-3 py-2 text-[11px] text-cream/40">
      A higher score unlocks bounties that other people cannot see.
    </div>
  </div>
);

export const HomeDiamondScore = () => (
  <section className="min-h-screen snap-start relative flex items-center overflow-hidden bg-[#0f0f0f]">
    <div className="grid lg:grid-cols-2 gap-0 items-center w-full">
      <div className="hidden lg:flex order-1 items-center justify-center px-12 py-16">
        <div className="w-full max-w-[520px]">
          <ScoreMockup />
        </div>
      </div>

      <div className="space-y-6 order-2 px-8 lg:px-16">
        <ScrollFadeIn>
          <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary leading-[1.2]">
            Your <span style={{ color: '#ed565a' }}>Diamond Score</span> gets you paid.
          </h2>
        </ScrollFadeIn>

        <ScrollFadeIn delay={100}>
          <p className="text-sm md:text-base font-mono text-primary/70 leading-relaxed">
            Rei scans your wallets and gives you a score out of 100. A better score means better
            bounties, and projects can see that you are a real, safe pick.
          </p>
        </ScrollFadeIn>

        <div className="space-y-4">
          {POINTS.map((p, i) => (
            <ScrollFadeIn key={p.title} delay={200 + i * 100}>
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/25 text-[#ed565a]">
                  {p.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-primary">{p.title}</p>
                  <p className="text-xs md:text-sm font-mono text-primary/60 leading-relaxed">{p.body}</p>
                </div>
              </div>
            </ScrollFadeIn>
          ))}
        </div>

        <ScrollFadeIn delay={500}>
          <button
            className="btn-manga btn-manga-primary px-8 py-3 mt-2"
            onClick={() => (window.location.href = '/rei')}
          >
            Get My Score
          </button>
        </ScrollFadeIn>
      </div>
    </div>
  </section>
);
