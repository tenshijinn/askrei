import { ScrollFadeIn } from './ScrollFadeIn';
import { ChevronDown, ArrowRight, Search } from 'lucide-react';

const CARD = '#111112';
const BORDER_SOFT = '#1c1c1e';
const BORDER = '#242426';
const TEXT = '#f2f0ec';
const MUTED = '#8a8a8e';
const DIM = '#5c5c60';
const PEACH = '#e8b4a0';

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 10 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: TEXT, lineHeight: 1 }}>{value}</div>
  </div>
);

const Chip = ({ k, v }: { k: string; v: string }) => (
  <span
    style={{
      border: `1px solid #2a2a2c`,
      borderRadius: 999,
      padding: '5px 10px',
      fontSize: 11,
      color: MUTED,
      display: 'inline-flex',
      gap: 6,
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{ color: DIM }}>{k}</span>
    <span style={{ color: TEXT, fontWeight: 600 }}>{v}</span>
  </span>
);

const MiniChart = () => (
  <svg viewBox="0 0 320 120" className="w-full h-auto" aria-hidden>
    {[0, 1, 2, 3].map((i) => (
      <line key={i} x1="0" y1={20 + i * 28} x2="320" y2={20 + i * 28} stroke="#1c1c1e" strokeWidth="1" />
    ))}
    <path d="M6 96 L54 82 L102 86 L150 60 L198 52 L246 34 L308 26" fill="none" stroke={PEACH} strokeWidth="2" strokeDasharray="4 4" />
    <path d="M6 108 L54 100 L102 96 L150 84 L198 76 L246 66 L308 52" fill="none" stroke={PEACH} strokeWidth="2" />
    <path d="M6 112 L54 108 L102 104 L150 100 L198 92 L246 88 L308 78" fill="none" stroke="#38bdc9" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M6 116 L54 114 L102 112 L150 108 L198 104 L246 100 L308 94" fill="none" stroke="#38bdc9" strokeWidth="2" />
  </svg>
);

const DashboardPreview = () => (
  <div className="flex flex-col gap-3">
    <div style={{ background: CARD, border: `1px solid ${BORDER_SOFT}`, borderRadius: 18, padding: 20 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#221f1e',
            border: `1px solid ${BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: PEACH,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          F
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: TEXT, lineHeight: 1.25 }}>
          From Property to Onchain Liquidity
        </div>
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          margin: '14px 0 10px',
          border: '1px solid rgba(74,222,128,.35)',
          color: '#4ade80',
          borderRadius: 999,
          padding: '4px 11px',
          fontSize: 12,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
        Active
      </div>
      <div style={{ color: DIM, fontSize: 12.5 }}>Promoted on 01 Aug 2026</div>

      <div
        style={{
          border: `1px solid ${BORDER_SOFT}`,
          borderRadius: 14,
          padding: '16px 18px',
          margin: '16px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 12,
        }}
      >
        <Stat label="Impressions" value="347" />
        <Stat label="Unique Clicks" value="72" />
        <Stat label="CTR" value="20.75%" />
      </div>

      <div
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          padding: '13px 16px',
          color: TEXT,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        View Campaign
        <ArrowRight className="h-4 w-4" style={{ color: MUTED }} />
      </div>
    </div>

    <div style={{ background: CARD, border: `1px solid ${BORDER_SOFT}`, borderRadius: 18, padding: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: TEXT }}>Clickthroughs Over Time</div>
      <div style={{ fontSize: 12.5, color: MUTED, margin: '4px 0 10px' }}>
        Daily activity · <span style={{ color: '#38bdc9' }}>guest</span> shown in teal
      </div>
      <MiniChart />
    </div>

    <div style={{ background: CARD, border: `1px solid ${BORDER_SOFT}`, borderRadius: 16, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: TEXT }}>Rei User Participants</span>
        <span style={{ fontSize: 12, color: DIM }}>72 members</span>
        <ChevronDown className="h-4 w-4 ml-auto" style={{ color: MUTED }} />
      </div>

      <div style={{ position: 'relative', margin: '14px 0 12px' }}>
        <Search className="h-4 w-4" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: DIM }} />
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: '10px 12px 10px 36px',
            fontSize: 13,
            color: DIM,
          }}
        >
          Search by name, handle, or address…
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#1a1a1c',
            border: `1px solid ${BORDER}`,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: PEACH,
            fontWeight: 600,
          }}
        >
          W
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 10.5, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', fontWeight: 600 }}>
            Diamond Holder
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '2px 0 8px' }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: TEXT, lineHeight: 1 }}>78</span>
            <span style={{ fontSize: 12, color: MUTED }}>/100</span>
            <span style={{ fontSize: 12, color: PEACH, fontWeight: 600 }}>Diamond</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip k="Community" v="62" />
            <Chip k="Confidence" v="81" />
            <Chip k="Trust" v="90" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const JoinReiCampaignTracking = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20">
      <div className="container mx-auto px-8 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
          <ScrollFadeIn>
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary leading-tight">
                Promote and Track Your Bounty Campaign
              </h2>
              <p className="mt-6 text-sm md:text-base font-mono text-primary/70 leading-relaxed max-w-md">
                Publish your bounty to Rei's matched feed and watch it work in real time. Impressions, clicks and
                click-through rate update live, while the participants panel shows exactly which Rei members engaged —
                complete with their Diamond score, community, confidence and trust signals. No guessing who showed up:
                see the diamond hands and filter out the farmers.
              </p>
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn delay={150}>
            <DashboardPreview />
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
};
