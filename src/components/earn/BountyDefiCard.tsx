import { useEffect, useMemo, useRef, useState } from 'react';
import './earn.css';
import { ALOGO, PLOGO } from './logos';
import {
  type AssetSeries,
  type TokenRow,
  ASSET_LOGO_URL,
  FREQ,
  LETTER,
  PLATFORMS,
  SEED_ASSETS,
  SEED_TOKENS,
  computeSeries,
  fmt,
  resolveWindow,
  smoothPath,
} from './data';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/earn-market`;
const FN_HEADERS = {
  'Content-Type': 'application/json',
  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
};

async function callFn(body: Record<string, string>) {
  const res = await fetch(FN_URL, { method: 'POST', headers: FN_HEADERS, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`earn-market ${res.status}`);
  return res.json();
}

function MiniLogo({ t }: { t?: TokenRow }) {
  if (!t) return null;
  const src = t.logo ?? (t.data ? ASSET_LOGO_URL[t.data] : undefined);
  if (src) return <img src={src} alt={t.sym} loading="lazy" />;
  return <span className="fallback">{t.sym.replace(/^w/, '').slice(0, 3)}</span>;
}

type Mode = 'DeFi' | 'Tokens';

const PERIODS: { value: string; label: string }[] = [
  { value: 'cycle', label: 'Bear Bottom → Bull Top' },
  ...[6, 12, 18, 24, 30, 36, 42, 48].map((n) => ({ value: String(n), label: `Last ${n} months` })),
];

export default function BountyDefiCard() {
  const [amount, setAmount] = useState(100);
  const [frequency, setFrequency] = useState('Monthly');
  const [mode, setMode] = useState<Mode>('DeFi');
  const [platform, setPlatform] = useState('Jito');
  const [asset, setAsset] = useState('SOL');
  const [period, setPeriod] = useState('cycle');

  const [assets, setAssets] = useState<Record<string, AssetSeries>>(SEED_ASSETS);
  const [tokens, setTokens] = useState<TokenRow[]>(SEED_TOKENS);
  const [tokenSeries, setTokenSeries] = useState<Record<string, AssetSeries>>({});
  const [loadingToken, setLoadingToken] = useState(false);
  const [selectedToken, setSelectedToken] = useState('SOL');
  const [ddOpen, setDdOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [nloApr, setNloApr] = useState<number | null>(null);
  const ddRef = useRef<HTMLDivElement>(null);

  // ----- live prices (Coinbase, via edge function) -----
  useEffect(() => {
    let alive = true;
    callFn({ action: 'prices' })
      .then((data) => {
        if (!alive || !data?.assets) return;
        setAssets((prev) => {
          const next = { ...prev };
          for (const [k, v] of Object.entries(data.assets as Record<string, AssetSeries>)) {
            if (v?.prices?.length) next[k] = { ...prev[k], ...v };
          }
          return next;
        });
        setSyncedAt(data.syncedAt ?? null);
      })
      .catch(() => {/* seed snapshot stays */});
    callFn({ action: 'tokens' })
      .then((data) => {
        if (!alive || !Array.isArray(data?.tokens) || !data.tokens.length) return;
        const seedBySym = Object.fromEntries(SEED_TOKENS.map((t) => [t.sym, t]));
        const live: TokenRow[] = data.tokens.map(
          (t: { id?: string; sym: string; name: string; logo?: string; cmcId?: number; mcap?: number }) => ({
            sym: t.sym,
            name: t.name,
            id: t.id,
            cmcId: t.cmcId,
            mcap: t.mcap,
            logo: t.logo ?? seedBySym[t.sym]?.logo,
            data: seedBySym[t.sym]?.data,
          }),
        );
        setTokens(live);
      })
      .catch(() => {/* seed list stays */});
    callFn({ action: 'nlo' })
      .then((data) => { if (alive && Number.isFinite(data?.apr)) setNloApr(Number(data.apr)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // keep asset valid for the selected platform
  const platformAssets = PLATFORMS[platform].assets;
  useEffect(() => {
    if (!platformAssets.includes(asset)) setAsset(platformAssets[0]);
  }, [platform, platformAssets, asset]);

  const tokenBySym = useMemo(() => Object.fromEntries(tokens.map((t) => [t.sym, t])), [tokens]);
  const token: TokenRow = tokenBySym[selectedToken] ?? tokens[0] ?? SEED_TOKENS[0];

  // ----- live per-token history + TGE on select -----
  useEffect(() => {
    if (mode !== 'Tokens' || !token || token.data || tokenSeries[token.sym]) return;
    let alive = true;
    setLoadingToken(true);
    callFn({ action: 'history', id: token.id ?? '', sym: token.sym })
      .then((data) => {
        if (!alive || !data?.prices?.length) return;
        setTokenSeries((prev) => ({
          ...prev,
          [token.sym]: {
            prices: data.prices,
            current: data.current,
            name: `${token.name} ($${token.sym})`,
            logoBg: 'transparent',
            startYear: data.startYear,
            startMonth: data.startMonth,
          },
        }));
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingToken(false); });
    return () => { alive = false; };
  }, [mode, token, tokenSeries]);

  // close the dropdown on outside click
  useEffect(() => {
    if (!ddOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDdOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [ddOpen]);

  const freq = FREQ[frequency];
  const monthlyContribution = Math.max(0, amount || 0) * freq.k;

  // ----- resolve the active series -----
  const isTokens = mode === 'Tokens';
  const platformCfg = PLATFORMS[platform];
  const rawApy = platformCfg.apy[asset] ?? 0;
  const apyVal = isTokens ? 0 : (platform === 'NLO by L1X' && nloApr ? nloApr : rawApy);

  const series: AssetSeries | null = isTokens
    ? (token?.data ? assets[token.data] : tokenSeries[token?.sym] ?? null)
    : assets[asset] ?? null;

  const hasData = !!series?.prices?.length;

  const computed = useMemo(() => {
    if (!series?.prices?.length) return null;
    const [startIdx, endIdx] = resolveWindow(period, series);
    const { value, contrib, invested } = computeSeries(series, apyVal, startIdx, endIdx, monthlyContribution);
    return { value, contrib, invested, startIdx };
  }, [series, period, apyVal, monthlyContribution]);

  // ----- header / title -----
  const platformLogo = PLOGO[platform];
  const assetLogoUrl = isTokens ? (token?.logo ?? (token?.data ? ASSET_LOGO_URL[token.data] : undefined)) : ASSET_LOGO_URL[asset];
  const assetLogoBg = isTokens
    ? (token?.data ? assets[token.data]?.logoBg ?? 'transparent' : 'transparent')
    : assets[asset]?.logoBg ?? 'transparent';
  const title = isTokens ? `${token?.name} ($${token?.sym})` : assets[asset]?.name ?? asset;
  const sub = isTokens ? 'Buy & hold' : platformCfg.verb;

  const filteredTokens = useMemo(() => {
    const f = search.trim().toLowerCase();
    return tokens.filter((t) => !f || t.sym.toLowerCase().includes(f) || t.name.toLowerCase().includes(f));
  }, [tokens, search]);

  // ----- chart geometry -----
  const chart = useMemo(() => {
    if (!computed) return null;
    const { value, contrib, invested, startIdx } = computed;
    const N = value.length;
    const yMax = Math.max(5000, Math.ceil(Math.max(...value, invested) / 5000) * 5000);
    const W = 1000, H = 320;
    const px = (j: number) => ((j + 0.5) / N) * W;
    const py = (v: number) => H - (v / yMax) * H;
    const valPts = value.map((v, j) => [px(j), py(v)] as [number, number]);
    const conPts = contrib.map((v, j) => [px(j), py(v)] as [number, number]);
    const valD = smoothPath(valPts);
    const areaD = `${valD} L${px(N - 1).toFixed(1)},${H.toFixed(1)} L${px(0).toFixed(1)},${H.toFixed(1)} Z`;
    const end = valPts[N - 1];
    const labels: { text: string; year: boolean }[] = [];
    for (let i = 0; i < N; i++) {
      const d = new Date(series!.startYear, series!.startMonth + startIdx + i, 1);
      if (d.getMonth() === 0) labels.push({ text: `'${String(d.getFullYear()).slice(-2)}`, year: true });
      else labels.push({ text: LETTER[d.getMonth()], year: false });
    }
    return {
      W, H, yMax, valD, conD: smoothPath(conPts), areaD,
      end, labels,
      yTicks: [yMax, (yMax * 2) / 3, yMax / 3, 0],
    };
  }, [computed, series]);

  const finalVal = computed ? computed.value[computed.value.length - 1] : 0;
  const invested = computed?.invested ?? 0;
  const down = finalVal - invested < 0;

  const cycleTag = period === 'cycle' && !series?.stable;
  const yieldValue = isTokens
    ? 'Buy & hold'
    : `${apyVal % 1 === 0 ? apyVal.toFixed(0) : apyVal.toFixed(2)}%`;
  const yieldLabel = isTokens ? 'no yield' : platformCfg.yieldNote;

  const syncedLabel = (() => {
    if (!syncedAt) return 'live prices';
    const hrs = Math.max(0, Math.round((Date.now() - new Date(syncedAt).getTime()) / 36e5));
    return `synced ${hrs}h ago`;
  })();

  return (
    <div className="earn-root">
      <div className="card">
        {/* header */}
        <div className="head">
          <div className="brand">
            {!isTokens && (
              <>
                <div className="logo" style={{ background: '#0e0b09' }}>
                  <img src={platformLogo.url} alt={platform} />
                </div>
                <div className="sep" />
              </>
            )}
            <div className="logo" style={{ background: assetLogoBg }}>
              {assetLogoUrl ? (
                <img src={assetLogoUrl} alt={isTokens ? token?.sym : asset} />
              ) : (
                <span dangerouslySetInnerHTML={{ __html: ALOGO[isTokens ? (token?.data ?? '') : asset] ?? '' }} />
              )}
            </div>
            <div className="title">
              <h1>{title}</h1>
              <p>{sub}</p>
            </div>
          </div>
        </div>

        {/* one natural sentence, edge to edge */}
        <div className="sentence">
          {!hasData ? (
            loadingToken ? (
              <>Loading live price history for <span className="num">${token?.sym}</span>…</>
            ) : (
              <>Live price history for <span className="num">${token?.sym}</span> is unavailable right now. Pick another token to run the backtest.</>
            )
          ) : (
            <>
              If you earned a <span className="num">${fmt(amount)}</span> bounty {freq.per} and{' '}
              {isTokens ? (
                <>bought <span className="num">${token?.sym}</span></>
              ) : (
                <>invested it into <span className="num">${asset}</span> on <span className="plat">{platform}</span></>
              )}
              , then your total bounties earned is <span className="num">${fmt(invested)}</span>, and the total made from{' '}
              {isTokens ? 'holding' : 'investing'} them is{' '}
              <span className={`made ${down ? 'down' : 'up'}`}>${fmt(finalVal)}</span>.
            </>
          )}
        </div>

        {/* controls */}
        <div className="controls">
          <div className="field">
            <label>Bounty amount</label>
            <input
              className="w-amt"
              type="number"
              min={0}
              step={50}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, +e.target.value || 0))}
            />
          </div>
          <div className="field">
            <label>How often</label>
            <select className="w-freq" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="Weekly">Weekly</option>
              <option value="Bi-Weekly">Bi-Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
          <div className="field">
            <label>Investment Type</label>
            <div className="toggle">
              {(['DeFi', 'Tokens'] as Mode[]).map((m) => (
                <button key={m} type="button" className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {!isTokens && (
            <>
              <div className="field">
                <label>DeFi platform</label>
                <select className="w-plat" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  {Object.keys(PLATFORMS).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Asset</label>
                <select
                  className="w-asset"
                  value={platformAssets.includes(asset) ? asset : platformAssets[0]}
                  disabled={platformAssets.length === 1}
                  onChange={(e) => setAsset(e.target.value)}
                >
                  {platformAssets.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {isTokens && (
            <div className="field">
              <label>Token</label>
              <div className="token-dd" ref={ddRef}>
                <button type="button" className="token-btn" onClick={() => setDdOpen((v) => !v)}>
                  <span className="tk">
                    <MiniLogo t={token} />
                    <span className="tsym">{token?.sym}</span>
                    <span className="tname">{token?.name}</span>
                  </span>
                  <svg viewBox="0 0 12 12" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 4l4 4 4-4" />
                  </svg>
                </button>
                {ddOpen && (
                  <div className="token-panel">
                    <input
                      type="text"
                      placeholder="Search symbol or name…"
                      autoComplete="off"
                      value={search}
                      autoFocus
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="token-list">
                      {filteredTokens.length === 0 ? (
                        <div className="token-empty">No tokens match "{search}"</div>
                      ) : (
                        filteredTokens.map((t) => (
                          <div
                            key={t.sym + (t.id ?? '')}
                            className={`token-item${t.sym === selectedToken ? ' sel' : ''}`}
                            onClick={() => { setSelectedToken(t.sym); setDdOpen(false); setSearch(''); }}
                          >
                            <MiniLogo t={t} />
                            <span className="tsym">{t.sym}</span>
                            <span className="tname">{t.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="field">
            <label>Time period</label>
            <select className="w-period" value={period} onChange={(e) => setPeriod(e.target.value)}>
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="yield-out">
            <span className="yv">{yieldValue}</span>
            <span className="yl">{yieldLabel}</span>
          </div>

          <div className="live-wrap"><span className="live" />{syncedLabel}</div>
        </div>

        {/* legend */}
        <div className="legend">
          <span><i className="swatch" />What it's worth now</span>
          <span><i className="swatch dash" />Total bounties put in</span>
          {cycleTag && <span className="cycle-tag">valued at cycle peak</span>}
          {!isTokens && apyVal > 100 && <span className="cycle-tag">very high APR — compounded flat</span>}
        </div>

        {/* chart */}
        <div className="chart">
          <div className="yaxis">
            {chart?.yTicks.map((v, i) => <span key={i}>{fmt(v)}</span>)}
          </div>
          <div className="plot">
            <div className="bars">
              {chart && (
                <>
                  <svg className="linechart" viewBox={`0 0 ${chart.W} ${chart.H}`} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="earnfillg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#eddccb" stopOpacity="0.30" />
                        <stop offset="1" stopColor="#eddccb" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <path d={chart.areaD} fill="url(#earnfillg)" />
                    <path d={chart.conD} fill="none" stroke="#8a7f74" strokeWidth={1.6} strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
                    <path d={chart.valD} fill="none" stroke="#eddccb" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <div
                    className="enddot"
                    style={{
                      left: `${((chart.end[0] / chart.W) * 100).toFixed(2)}%`,
                      top: `${((chart.end[1] / chart.H) * 100).toFixed(2)}%`,
                    }}
                  />
                </>
              )}
            </div>
            <div className="xaxis">
              {chart?.labels.map((l, i) => (
                <span key={i} className={l.year ? 'year' : undefined}>{l.text}</span>
              ))}
            </div>
          </div>
        </div>

        <p className="footnote">
          Backtest over the selected past period — not a forecast. Prices are real market data; DeFi yields are
          period-average estimates unless a live source is connected.
        </p>
      </div>
    </div>
  );
}
