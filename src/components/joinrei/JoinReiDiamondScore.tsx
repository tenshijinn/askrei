import { ScrollFadeIn } from './ScrollFadeIn';
import { scrollToLastSection } from './scrollHelpers';

const POINTS = [
  {
    title: 'Wallet Behaviour',
    body: 'We scan holding patterns, sell pressure and how long tokens stay in the wallet — dumpers score low.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
        <path d="M12 2l8 6-8 14-8-14 8-6z" />
      </svg>
    ),
  },
  {
    title: 'Community Signal',
    body: 'Real participation across chains, platforms and communities — not one-time farming activity.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
      </svg>
    ),
  },
  {
    title: 'Sybil & JEET Risk',
    body: 'Fresh wallets, funding loops and bot-like patterns lower Trust, so airdrops reach real humans.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

const MEMBERS = [
  { name: 'REI', handle: 'rei_protocol', score: 63, tier: 'Sapphire', sol: '9q8Q…t118', evm: '0x1f…2cb8', c: 15, cf: 55, t: 100 },
  { name: 'MIKA TAN', handle: 'mikabuilds', score: 73, tier: 'Sapphire', sol: 'xDb6…TJN6', evm: '0x45…189f', c: 82, cf: 74, t: 66 },
  { name: 'DEV ANAND', handle: '0xdevanand', score: 58, tier: 'Sapphire', sol: 'thpf…d7HJ', evm: '0x23…21af', c: 44, cf: 91, t: 38 },
  { name: 'YUKI', handle: 'yuki_onchain', score: 62, tier: 'Sapphire', sol: 'rV2Q…dYsc', evm: null, c: 61, cf: 33, t: 88 },
  { name: 'SOL SISTER', handle: 'solsister', score: 52, tier: 'Emerald', sol: 'vJ7p…bqfP', evm: null, c: 29, cf: 67, t: 52 },
];

const Chip = ({ label, value }: { label: string; value: number }) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161618] px-2 py-1 text-[10px] text-cream/50">
    {label} <span className="text-[#e8b4a0]">•</span>
    <span className="text-cream/90 font-medium">{value}</span>
  </span>
);

const WalletChip = ({ net, addr }: { net: string; addr: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161618] px-2 py-1 text-[10px] font-mono text-cream/70">
    <span className="rounded bg-[#2a2a2c] px-1.5 py-0.5 text-[8px] tracking-wider text-cream/60">{net}</span>
    {addr}
  </span>
);

/** Static mockup of the Rei User Participants card shown on the account dashboard. */
const ParticipantsMockup = () => (
  <div className="w-full rounded-2xl border-[0.5px] border-white/10 bg-[#111112] p-4 md:p-5">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-cream">Rei User Participants</span>
        <span className="text-[11px] text-cream/40">9 members</span>
      </div>
      <span className="text-[11px] text-[#e8b4a0]">Export CSV</span>
    </div>

    <div className="mb-3 rounded-xl border border-white/10 bg-[#0d0d0e] px-3 py-2 text-[11px] text-cream/30">
      Search by name, handle, or address…
    </div>

    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-[10px] text-cream/40">Sort by</span>
      {['Diamond Score', 'Community', 'Confidence', 'Trust'].map((s, i) => (
        <span
          key={s}
          className={`rounded-full border px-2.5 py-1 text-[10px] ${
            i === 0
              ? 'border-[#e8b4a0]/40 text-[#e8b4a0]'
              : 'border-white/10 text-cream/50'
          }`}
        >
          {s}
        </span>
      ))}
    </div>

    <div className="space-y-2.5 max-h-[46vh] overflow-hidden">
      {MEMBERS.map((m) => (
        <div key={m.handle} className="flex gap-3 rounded-xl border border-white/10 bg-[#131315] p-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#221f1e] text-sm font-semibold text-[#e8b4a0]">
            {m.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px]">
              <span className="tracking-[0.14em] text-cream/80">{m.name}</span>
              <span className="text-cream/35">@{m.handle}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-semibold text-cream">{m.score}</span>
              <span className="text-[10px] text-cream/40">/100</span>
              <span className="text-[10px] text-[#e8b4a0]">· {m.tier}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <WalletChip net="SOL" addr={m.sol} />
              {m.evm && <WalletChip net="EVM" addr={m.evm} />}
              <Chip label="Community" value={m.c} />
              <Chip label="Confidence" value={m.cf} />
              <Chip label="Trust" value={m.t} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const JoinReiDiamondScore = () => (
  <section className="min-h-screen snap-start relative flex items-center overflow-hidden bg-[#0f0f0f]">
    <div className="grid lg:grid-cols-2 gap-0 items-center w-full">
      <div className="hidden lg:flex order-1 items-center justify-center px-12 py-16">
        <div className="w-full max-w-[520px]">
          <ParticipantsMockup />
        </div>
      </div>

      <div className="space-y-6 order-2 px-8 lg:px-16">
        <ScrollFadeIn>
          <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary leading-[1.2]">
            How the <span style={{ color: '#ed565a' }}>Diamond Score</span> works.
          </h2>
        </ScrollFadeIn>

        <ScrollFadeIn delay={100}>
          <p className="text-sm md:text-base font-mono text-primary/70 leading-relaxed">
            Every Rei user gets a score out of 100 from an on-chain scan of their wallets. You see it
            for every participant in your campaign.
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
          <button className="btn-manga btn-manga-primary px-8 py-3 mt-2" onClick={scrollToLastSection}>
            Promote Task
          </button>
        </ScrollFadeIn>
      </div>
    </div>
  </section>
);
