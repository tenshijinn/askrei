import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Download, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ParticipantCard, type Participant } from './ParticipantCard';

type SortKey = 'score' | 'community' | 'confidence' | 'trust';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Diamond Score' },
  { key: 'community', label: 'Community' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'trust', label: 'Trust' },
];

const PEACH = '#e8c4b8';
const MUTED = '#5c5a57';
const TEXT = '#f0ede8';

function valueFor(p: Participant, key: SortKey): number | null {
  if (key === 'score') return p.diamondScore;
  if (key === 'community') return p.community;
  if (key === 'confidence') return p.confidence;
  return p.trust;
}

function csvCell(v: unknown) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ReiParticipants() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Participant[]>([]);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sort, setSort] = useState<SortKey | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 180);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke('rei-participants', { body: {} });
        if (fnErr) throw fnErr;
        if (cancelled) return;
        setRows(Array.isArray(data?.participants) ? data.participants : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load participants');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    let list = rows;
    if (debounced) {
      list = list.filter((p) =>
        [p.displayName, p.handle, p.solWallet, p.evmWallet]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(debounced))
      );
    }
    if (sort) {
      list = [...list].sort((a, b) => {
        const av = valueFor(a, sort);
        const bv = valueFor(b, sort);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return bv - av;
      });
    }
    return list;
  }, [rows, debounced, sort]);

  const exportCsv = () => {
    const header = [
      'name',
      'handle',
      'sol_wallet',
      'evm_wallet',
      'diamond_score',
      'tier',
      'community',
      'confidence',
      'trust',
    ];
    const lines = [
      header.join(','),
      ...visible.map((p) =>
        [
          p.displayName ?? '',
          p.handle ? `@${p.handle.replace(/^@/, '')}` : '',
          p.solWallet ?? '',
          p.evmWallet ?? '',
          p.diamondScore ?? '',
          p.diamondTier ?? '',
          p.community ?? '',
          p.confidence ?? '',
          p.trust ?? '',
        ]
          .map(csvCell)
          .join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rei-participants-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rei-surface" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '20px 24px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 500, color: TEXT, letterSpacing: '-0.02em' }}>
          Rei User Participants
        </span>
        <span style={{ fontSize: 12, color: MUTED, marginLeft: 'auto' }}>
          {loading ? '…' : `${rows.length} member${rows.length === 1 ? '' : 's'}`}
        </span>
        <ChevronDown
          className="h-4 w-4"
          style={{ color: '#a09e9a', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div style={{ padding: '0 24px 24px' }}>
          {/* search */}
          <div
            className="rei-stat-card"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 12 }}
          >
            <Search className="h-4 w-4" style={{ color: MUTED, flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, handle, or address…"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: TEXT,
                fontSize: 13,
              }}
            />
          </div>

          {/* sort row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Sort by
            </span>
            {SORTS.map((s) => {
              const active = sort === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSort(active ? null : s.key)}
                  className="rei-chip"
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    gap: 6,
                    cursor: 'pointer',
                    color: active ? TEXT : '#a09e9a',
                    background: active ? 'hsla(18,52%,82%,0.10)' : undefined,
                    borderColor: active ? 'hsla(18,52%,82%,0.35)' : undefined,
                  }}
                >
                  {s.label}
                  {active && <span style={{ color: PEACH }}>↓</span>}
                </button>
              );
            })}
            <button
              type="button"
              onClick={exportCsv}
              disabled={visible.length === 0}
              className="rei-chip"
              style={{
                marginLeft: 'auto',
                padding: '6px 12px',
                fontSize: 11,
                gap: 7,
                cursor: visible.length ? 'pointer' : 'not-allowed',
                color: PEACH,
                borderColor: 'hsla(18,52%,82%,0.35)',
                opacity: visible.length ? 1 : 0.5,
              }}
            >
              <Download className="h-3 w-3" />
              Export CSV
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 py-8 justify-center" style={{ color: MUTED, fontSize: 12 }}>
              <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
            </div>
          )}

          {!loading && error && (
            <div className="rei-stat-card" style={{ padding: 16, color: '#e8a8a8', fontSize: 12 }}>
              {error}
            </div>
          )}

          {!loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visible.map((p) => (
                <ParticipantCard key={p.id} p={p} />
              ))}
              {visible.length === 0 && (
                <div
                  className="rei-stat-card"
                  style={{ padding: '32px 24px', textAlign: 'center', color: MUTED, fontSize: 13 }}
                >
                  {rows.length === 0 ? 'No members yet' : 'No members match your search'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .rp-main { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
          .rp-score { text-align: left !important; }
          .rp-metrics { justify-content: flex-start !important; }
        }
      `}</style>
    </div>
  );
}

export default ReiParticipants;
