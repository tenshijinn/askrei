import reiLogo from '@/assets/rei-logo.png';
import { fmt } from './data';

export interface ShareImageProps {
  amount: number;
  per: string;
  targetLabel: string;   // "$SOL on Jito" | "$BONK (buy & hold)"
  periodLabel: string;   // "Bear bottom → Bull top" | "Last 24 months"
  invested: number;
  finalVal: number;
  yieldValue: string;
  chart: {
    W: number;
    H: number;
    valD: string;
    conD: string;
    areaD: string;
  } | null;
}

const ACCENT = '#e9c8ba';
const RED = '#ed565a';

/** Off-screen 1200x675 (16:9) tweet image. Rendered with inline styles only so
 *  html-to-image can serialise it without any external stylesheet. */
export default function ShareImage({
  amount, per, targetLabel, periodLabel, invested, finalVal, yieldValue, chart,
}: ShareImageProps) {
  const gain = finalVal - invested;
  const pct = invested > 0 ? (gain / invested) * 100 : 0;
  const down = gain < 0;

  const row = (label: string, value: string, color = '#f4ece7') => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderBottom: '1px solid rgba(233,200,186,0.14)' }}>
      <span style={{ fontSize: 19, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(244,236,231,0.55)' }}>{label}</span>
      <span style={{ fontSize: 23, fontWeight: 700, color }}>{value}</span>
    </div>
  );

  return (
    <div
      style={{
        width: 1200, height: 675, background: '#0b0a09', color: '#f4ece7',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        padding: 44, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
        border: `1px solid rgba(233,200,186,0.22)`, position: 'relative', overflow: 'hidden',
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(244,236,231,0.5)' }}>
            Rei.chat / Bounty DCA Backtest
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, marginTop: 8, color: ACCENT }}>
            ${fmt(amount)} bounty {per} → {targetLabel}
          </div>
        </div>
        <img src={reiLogo} alt="Rei" width={132} height={132} style={{ width: 132, height: 132, objectFit: 'contain', opacity: 0.95 }} />
      </div>

      {/* body: itemised numbers + chart */}
      <div style={{ display: 'flex', gap: 36, marginTop: 26, flex: 1 }}>
        <div style={{ width: 430, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 15, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(244,236,231,0.45)' }}>
            Total value
          </div>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, color: down ? RED : ACCENT }}>
            ${fmt(finalVal)}
          </div>
          <div style={{ marginTop: 14 }}>
            {row('Bounties staked', `$${fmt(invested)}`, RED)}
            {row('Profit', `${down ? '-' : '+'}$${fmt(Math.abs(gain))}`, down ? RED : '#9fe6b4')}
            {row('Return', `${down ? '' : '+'}${pct.toFixed(1)}%`, down ? RED : '#9fe6b4')}
            {row('Yield', yieldValue)}
            {row('Window', periodLabel)}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {chart && (
            <svg viewBox={`0 0 ${chart.W} ${chart.H}`} preserveAspectRatio="none" style={{ width: '100%', height: 300 }}>
              <defs>
                <linearGradient id="shareFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity="0.34" />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={chart.areaD} fill="url(#shareFill)" />
              <path d={chart.conD} fill="none" stroke={RED} strokeWidth={5} strokeDasharray="14 10" />
              <path d={chart.valD} fill="none" stroke={ACCENT} strokeWidth={6} />
            </svg>
          )}
          <div style={{ display: 'flex', gap: 22, marginTop: 12, fontSize: 16, color: 'rgba(244,236,231,0.6)' }}>
            <span><span style={{ color: ACCENT }}>━</span> Portfolio value</span>
            <span><span style={{ color: RED }}>┄</span> Total bounties staked</span>
          </div>
        </div>
      </div>

      {/* footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, fontSize: 17, color: 'rgba(244,236,231,0.55)' }}>
        <span>Earn bounties → stake in DeFi</span>
        <span style={{ color: ACCENT }}>rei.chat · @AskRei_</span>
      </div>
    </div>
  );
}
