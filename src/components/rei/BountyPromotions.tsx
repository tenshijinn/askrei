import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ArrowRight, ChevronDown } from 'lucide-react';

/**
 * Bounty Promotions analytics section for the Account page.
 *
 * NOTE: Real click-tracking on promoted campaigns isn't wired up yet —
 * `campaign_subscriptions` is admin-readable only and has no per-click table.
 * This component renders the section with sample campaigns so the design lands;
 * swap `SAMPLE_CAMPAIGNS` for a live query + a `campaign_clicks` aggregate
 * when tracking is in place.
 */

type Status = 'Active' | 'Completed';

interface Campaign {
  id: string;
  name: string;
  source: string;
  promotedOn: string; // display date
  status: Status;
  iconBg: string;
  icon: React.ReactNode;
  totalClicks: number;
  uniqueClicks: number;
  ctr: number; // percent
  series: { date: string; clicks: number }[];
}

const SolanaMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
    <defs>
      <linearGradient id="sol-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#9945FF" />
        <stop offset="100%" stopColor="#14F195" />
      </linearGradient>
    </defs>
    <path
      fill="url(#sol-g)"
      d="M5 7.6c.1-.1.3-.2.5-.2h12.8c.3 0 .5.3.3.6L17 9.7c-.1.1-.3.2-.5.2H3.7c-.3 0-.5-.3-.3-.6L5 7.6Zm0 8.8c.1-.1.3-.2.5-.2h12.8c.3 0 .5.3.3.6L17 18.5c-.1.1-.3.2-.5.2H3.7c-.3 0-.5-.3-.3-.6L5 16.4Zm12-4.4c-.1-.1-.3-.2-.5-.2H3.7c-.3 0-.5.3-.3.6L5 14.1c.1.1.3.2.5.2h12.8c.3 0 .5-.3.3-.6L17 12Z"
    />
  </svg>
);

const JupiterMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="#0a1f1a" />
    <path d="M5 14c3-4 6-4 9 0s3 4 5 0" stroke="#22c55e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M5 10c3-4 6-4 9 0s3 4 5 0" stroke="#84cc16" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7" />
  </svg>
);

const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    id: 'solana-saga-arubaito',
    name: 'Solana Saga X ARUBAITO',
    source: 'Superteam',
    promotedOn: '12 Apr 2024',
    status: 'Completed',
    iconBg: 'rgba(153,69,255,0.14)',
    icon: <SolanaMark />,
    totalClicks: 12845,
    uniqueClicks: 7213,
    ctr: 8.42,
    series: [
      { date: 'Apr 12', clicks: 820 },
      { date: 'Apr 13', clicks: 2310 },
      { date: 'Apr 14', clicks: 1180 },
      { date: 'Apr 15', clicks: 640 },
      { date: 'Apr 16', clicks: 1420 },
      { date: 'Apr 17', clicks: 1240 },
      { date: 'Apr 18', clicks: 1100 },
      { date: 'Apr 19', clicks: 520 },
    ],
  },
  {
    id: 'jupiter-planetary',
    name: 'Jupiter Planetary Quest',
    source: 'Layer3',
    promotedOn: '28 Mar 2024',
    status: 'Completed',
    iconBg: 'rgba(34,197,94,0.14)',
    icon: <JupiterMark />,
    totalClicks: 9432,
    uniqueClicks: 5602,
    ctr: 7.21,
    series: [
      { date: 'Mar 28', clicks: 720 },
      { date: 'Mar 29', clicks: 1510 },
      { date: 'Mar 30', clicks: 760 },
      { date: 'Mar 31', clicks: 1320 },
      { date: 'Apr 01', clicks: 680 },
      { date: 'Apr 02', clicks: 1010 },
      { date: 'Apr 03', clicks: 420 },
      { date: 'Apr 04', clicks: 160 },
    ],
  },
];

type Range = 'all' | '30d' | '7d';
const RANGE_LABEL: Record<Range, string> = { all: 'All Time', '30d': 'Last 30 Days', '7d': 'Last 7 Days' };

const StatusPill = ({ status }: { status: Status }) => (
  <span
    className="rei-chip"
    style={{
      padding: '2px 8px',
      fontSize: '9px',
      letterSpacing: '0.04em',
      color: status === 'Active' ? '#a8e6b8' : '#e8c4b8',
      borderColor:
        status === 'Active' ? 'hsla(140,52%,72%,0.3)' : 'hsla(18,52%,82%,0.3)',
      background: '#1e1e1e',
    }}
  >
    {status}
  </span>
);

const numFmt = (n: number) => n.toLocaleString();

const ChartCard = ({ campaign }: { campaign: Campaign }) => (
  <div className="rei-surface" style={{ padding: '20px', minHeight: 320 }}>
    <h4 style={{ fontSize: '15px', fontWeight: 500, color: '#f0ede8', margin: 0 }}>Clickthroughs Over Time</h4>
    <p style={{ fontSize: '11px', color: '#5c5a57', margin: '2px 0 12px' }}>Daily Clicks</p>
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={campaign.series} margin={{ top: 6, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="hsla(0,0%,100%,0.06)" strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#5c5a57"
            tick={{ fontSize: 10, fill: '#5c5a57' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#5c5a57"
            tick={{ fontSize: 10, fill: '#5c5a57' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : `${v}`)}
          />
          <Tooltip
            contentStyle={{
              background: '#141414',
              border: '0.5px solid hsla(0,0%,100%,0.12)',
              borderRadius: 10,
              fontSize: 12,
              color: '#f0ede8',
            }}
            cursor={{ stroke: 'hsla(18,52%,82%,0.25)', strokeWidth: 1 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#a09e9a' }} iconType="plainline" />
          <Line
            type="monotone"
            dataKey="clicks"
            name="Clicks"
            stroke="#e8c4b8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#e8c4b8' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const CampaignInfoCard = ({ campaign }: { campaign: Campaign }) => (
  <div className="rei-surface" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div className="flex items-start gap-3">
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 44, height: 44, borderRadius: '50%', background: campaign.iconBg }}
      >
        {campaign.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#f0ede8', margin: 0, letterSpacing: '-0.01em' }}>
            {campaign.name}
          </h3>
          <StatusPill status={campaign.status} />
        </div>
        <p style={{ fontSize: '12px', color: '#5c5a57', margin: '4px 0 0' }}>
          Promoted on {campaign.promotedOn} · {campaign.source}
        </p>
      </div>
    </div>

    <div className="rei-stat-card" style={{ padding: '14px 16px' }}>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Clicks', value: numFmt(campaign.totalClicks) },
          { label: 'Unique Clicks', value: numFmt(campaign.uniqueClicks) },
          { label: 'CTR', value: `${campaign.ctr.toFixed(2)}%` },
        ].map((stat) => (
          <div key={stat.label}>
            <p style={{ fontSize: '10px', color: '#5c5a57', margin: 0, letterSpacing: '0.04em' }}>{stat.label}</p>
            <p
              style={{
                fontSize: '20px',
                fontWeight: 500,
                color: '#f0ede8',
                margin: '4px 0 0',
                letterSpacing: '-0.02em',
                fontFamily: "'SF Mono', 'Consolas', monospace",
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>

    <button
      type="button"
      className="rei-stat-card flex items-center justify-between"
      style={{ padding: '14px 18px', cursor: 'pointer', fontSize: 13, color: '#f0ede8', textAlign: 'left' }}
    >
      <span>View Campaign</span>
      <ArrowRight className="h-4 w-4" style={{ color: '#a09e9a' }} />
    </button>
  </div>
);

export const BountyPromotions = () => {
  const [range, setRange] = useState<Range>('all');
  const [open, setOpen] = useState(false);
  const campaigns = useMemo(() => SAMPLE_CAMPAIGNS, []);

  return (
    <div className="rei-surface" style={{ padding: '24px' }}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#f0ede8', margin: 0, letterSpacing: '-0.02em' }}>
            Bounty Promotions
          </h2>
          <p style={{ fontSize: '12px', color: '#5c5a57', margin: '4px 0 0' }}>
            Bounties you've boosted with Rei and their performance.
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rei-chip"
            style={{ padding: '6px 12px', fontSize: 11, color: '#f0ede8' }}
          >
            {RANGE_LABEL[range]}
            <ChevronDown className="h-3 w-3" style={{ color: '#a09e9a' }} />
          </button>
          {open && (
            <div
              className="rei-surface"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                padding: 4,
                minWidth: 140,
                zIndex: 30,
              }}
            >
              {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRange(r); setOpen(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    color: range === r ? '#f0ede8' : '#a09e9a',
                    background: range === r ? 'hsla(18,52%,82%,0.08)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {RANGE_LABEL[r]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {campaigns.map((c) => (
          <div key={c.id} className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)' }}>
            <CampaignInfoCard campaign={c} />
            <ChartCard campaign={c} />
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .rei-surface > .grid[style*="1.6fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default BountyPromotions;
