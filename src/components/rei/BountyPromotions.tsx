import { useEffect, useMemo, useState } from 'react';
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
import { ArrowRight, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Live Bounty Promotions analytics for the Account page.
 * Scoped to the logged-in user via x_user_id / wallet_address.
 */

type Status = 'Active' | 'Completed' | 'Canceled' | 'Past Due';
type Range = 'all' | '30d' | '7d';
const RANGE_LABEL: Record<Range, string> = {
  all: 'All Time',
  '30d': 'Last 30 Days',
  '7d': 'Last 7 Days',
};
const RANGE_DAYS: Record<Range, number | null> = { all: null, '30d': 30, '7d': 7 };

interface ClickRow {
  campaign_subscription_id: string;
  click_date: string;
  ip_hash: string | null;
}

interface CampaignRow {
  id: string;
  project_name: string;
  project_link: string;
  short_code: string | null;
  status: string;
  created_at: string;
  expires_at: string | null;
}

interface CampaignView {
  id: string;
  name: string;
  status: Status;
  promotedOn: string;
  projectLink: string;
  shortCode: string | null;
  totalClicks: number;
  uniqueClicks: number;
  ctr: number;
  series: { date: string; clicks: number }[];
}

const numFmt = (n: number) => n.toLocaleString();

const statusFor = (raw: string, expires: string | null): Status => {
  if (raw === 'canceled') return 'Canceled';
  if (raw === 'past_due') return 'Past Due';
  if (raw === 'active' || raw === 'trialing') {
    if (expires && new Date(expires) < new Date()) return 'Completed';
    return 'Active';
  }
  return 'Completed';
};

const statusColors = (s: Status) => {
  if (s === 'Active') return { color: '#a8e6b8', border: 'hsla(140,52%,72%,0.3)' };
  if (s === 'Past Due') return { color: '#e8d4b8', border: 'hsla(40,52%,72%,0.3)' };
  if (s === 'Canceled') return { color: '#e8a8a8', border: 'hsla(0,52%,72%,0.3)' };
  return { color: '#e8c4b8', border: 'hsla(18,52%,82%,0.3)' };
};

const StatusPill = ({ status }: { status: Status }) => {
  const c = statusColors(status);
  return (
    <span
      className="rei-chip"
      style={{
        padding: '2px 8px',
        fontSize: '9px',
        letterSpacing: '0.04em',
        color: c.color,
        borderColor: c.border,
        background: '#1e1e1e',
      }}
    >
      {status}
    </span>
  );
};

const ChartCard = ({ campaign }: { campaign: CampaignView }) => (
  <div className="rei-surface" style={{ padding: '20px', minHeight: 320 }}>
    <h4 style={{ fontSize: '15px', fontWeight: 500, color: '#f0ede8', margin: 0 }}>Clickthroughs Over Time</h4>
    <p style={{ fontSize: '11px', color: '#5c5a57', margin: '2px 0 12px' }}>Daily Clicks</p>
    <div style={{ width: '100%', height: 240 }}>
      {campaign.series.length === 0 ? (
        <div className="flex items-center justify-center h-full" style={{ color: '#5c5a57', fontSize: 12 }}>
          No clicks yet in this range
        </div>
      ) : (
        <ResponsiveContainer>
          <LineChart data={campaign.series} margin={{ top: 6, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="hsla(0,0%,100%,0.06)" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="date" stroke="#5c5a57" tick={{ fontSize: 10, fill: '#5c5a57' }} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#5c5a57"
              tick={{ fontSize: 10, fill: '#5c5a57' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : `${v}`)}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ background: '#141414', border: '0.5px solid hsla(0,0%,100%,0.12)', borderRadius: 10, fontSize: 12, color: '#f0ede8' }}
              cursor={{ stroke: 'hsla(18,52%,82%,0.25)', strokeWidth: 1 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#a09e9a' }} iconType="plainline" />
            <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#e8c4b8" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#e8c4b8' }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

const CampaignInfoCard = ({ campaign }: { campaign: CampaignView }) => (
  <div className="rei-surface" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div className="flex items-start gap-3">
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(232,196,184,0.14)', color: '#e8c4b8', fontWeight: 600 }}
      >
        {campaign.name.slice(0, 1).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#f0ede8', margin: 0, letterSpacing: '-0.01em' }}>{campaign.name}</h3>
          <StatusPill status={campaign.status} />
        </div>
        <p style={{ fontSize: '12px', color: '#5c5a57', margin: '4px 0 0' }}>Promoted on {campaign.promotedOn}</p>
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

    <a
      href={campaign.projectLink || '#'}
      target="_blank"
      rel="noreferrer noopener"
      className="rei-stat-card flex items-center justify-between"
      style={{ padding: '14px 18px', cursor: 'pointer', fontSize: 13, color: '#f0ede8', textAlign: 'left', textDecoration: 'none' }}
    >
      <span>View Campaign</span>
      <ArrowRight className="h-4 w-4" style={{ color: '#a09e9a' }} />
    </a>
  </div>
);

interface Props {
  xUserId?: string | null;
  walletAddress?: string | null;
}

export const BountyPromotions = ({ xUserId, walletAddress }: Props) => {
  const [range, setRange] = useState<Range>('all');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!xUserId && !walletAddress) {
        setLoading(false);
        setCampaigns([]);
        setClicks([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const filters: string[] = [];
        if (xUserId) filters.push(`x_user_id.eq.${xUserId}`);
        if (walletAddress) filters.push(`wallet_address.eq.${walletAddress}`);
        const { data: camps, error: campErr } = await supabase
          .from('v_public_campaign_subscriptions')
          .select('id, project_name, project_link, short_code, status, created_at, expires_at')
          .or(filters.join(','))
          .order('created_at', { ascending: false });
        if (campErr) throw campErr;
        if (cancelled) return;
        setCampaigns(camps || []);

        const ids = (camps || []).map((c) => c.id);
        if (ids.length === 0) {
          setClicks([]);
        } else {
          const { data: ck, error: ckErr } = await supabase
            .from('campaign_clicks')
            .select('campaign_subscription_id, click_date, ip_hash')
            .in('campaign_subscription_id', ids);
          if (ckErr) throw ckErr;
          if (!cancelled) setClicks(ck || []);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('[BountyPromotions] load failed; showing empty state:', e);
          setCampaigns([]);
          setClicks([]);
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

    }
    load();
    return () => {
      cancelled = true;
    };
  }, [xUserId, walletAddress]);

  const views = useMemo<CampaignView[]>(() => {
    const days = RANGE_DAYS[range];
    const cutoff = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
    return campaigns.map((c) => {
      const myClicks = clicks.filter((k) => {
        if (k.campaign_subscription_id !== c.id) return false;
        if (!cutoff) return true;
        return new Date(k.click_date) >= cutoff;
      });
      const totalClicks = myClicks.length;
      const uniqueClicks = new Set(myClicks.map((k) => k.ip_hash || '')).size;
      const ctr = totalClicks ? (uniqueClicks / totalClicks) * 100 : 0;

      // Build daily buckets
      const byDay = new Map<string, number>();
      for (const k of myClicks) {
        byDay.set(k.click_date, (byDay.get(k.click_date) || 0) + 1);
      }
      const series = Array.from(byDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }),
          clicks: count,
        }));

      const status = statusFor(c.status, c.expires_at);
      return {
        id: c.id,
        name: c.project_name,
        status,
        promotedOn: new Date(c.created_at).toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        projectLink: c.project_link,
        shortCode: c.short_code,
        totalClicks,
        uniqueClicks,
        ctr,
        series,
      };
    });
  }, [campaigns, clicks, range]);

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
              style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, padding: 4, minWidth: 140, zIndex: 30 }}
            >
              {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRange(r);
                    setOpen(false);
                  }}
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

      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center" style={{ color: '#5c5a57', fontSize: 12 }}>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading promotions…
        </div>
      )}

      {!loading && error && (
        <div className="rei-stat-card" style={{ padding: 16, color: '#e8a8a8', fontSize: 12 }}>{error}</div>
      )}

      {!loading && !error && views.length === 0 && (
        <div
          className="rei-stat-card flex flex-col items-center text-center"
          style={{ padding: '32px 24px', gap: 8 }}
        >
          <p style={{ fontSize: 14, color: '#f0ede8', margin: 0 }}>No bounty promotions yet</p>
          <p style={{ fontSize: 12, color: '#5c5a57', margin: 0 }}>
            Promote a bounty through Rei and you'll see live clickthrough analytics here.
          </p>
          <a
            href="/unlimited-posts"
            style={{ marginTop: 8, fontSize: 12, color: '#e8c4b8', textDecoration: 'underline' }}
          >
            Promote a bounty →
          </a>
        </div>
      )}

      {!loading && !error && views.length > 0 && (
        <div className="flex flex-col gap-4">
          {views.map((c) => (
            <div key={c.id} className="grid gap-4 bp-row" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)' }}>
              <CampaignInfoCard campaign={c} />
              <ChartCard campaign={c} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .bp-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default BountyPromotions;
