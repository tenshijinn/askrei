// Shared backtest math for the /earn Bounty Earning Calculator.
// Mirrors src/components/earn/data.ts so the agent API returns exactly what the
// page shows. Market data comes from the earn-market function (which owns the
// provider fallbacks + persistent cache).

export interface AssetSeries {
  prices: number[];
  current: number;
  name: string;
  startYear: number;
  startMonth: number; // 0-11
  stable?: boolean;
}

export interface Platform {
  assets: string[];
  apy: Record<string, number>;
  verb: string;
  yieldNote: string;
}

export const PLATFORMS: Record<string, Platform> = {
  'Jito':       { assets: ['SOL'],                           apy: { SOL: 8.0 },                                           verb: 'Staked with Jito',       yieldNote: 'avg staking yield' },
  'Kamino':     { assets: ['USDC','USDT','SOL','BTC','ETH'], apy: { USDC: 7.5, USDT: 7.0, SOL: 3.0, BTC: 0.5, ETH: 1.5 }, verb: 'Lent on Kamino',         yieldNote: 'avg lending yield' },
  'Marinade':   { assets: ['SOL'],                           apy: { SOL: 7.2 },                                           verb: 'Staked with Marinade',   yieldNote: 'avg staking yield' },
  'marginfi':   { assets: ['USDC','USDT','SOL','BTC','ETH'], apy: { USDC: 5.5, USDT: 5.0, SOL: 2.5, BTC: 0.4, ETH: 1.2 }, verb: 'Lent on marginfi',       yieldNote: 'avg lending yield' },
  'NLO by L1X': { assets: ['USDC'],                          apy: { USDC: 273.37 },                                       verb: 'Auto-compounded on NLO', yieldNote: '30-day avg verified yield' },
};

export const PLATFORM_X: Record<string, string> = {
  'Jito': '@jito',
  'Kamino': '@Kamino',
  'Marinade': '@MarinadeFinance',
  'marginfi': '@marginfi',
  'NLO by L1X': '@NLOFinance',
};

export const FREQ: Record<string, { k: number; per: string }> = {
  'Weekly':    { k: 52 / 12, per: 'per week' },
  'Bi-Weekly': { k: 26 / 12, per: 'bi-weekly' },
  'Monthly':   { k: 1,       per: 'per month' },
};

export const PERIODS = ['cycle', '6', '12', '18', '24', '30', '36', '42', '48'];

export const ASSET_NAMES: Record<string, string> = {
  SOL: 'Solana (SOL)',
  USDC: 'USD Coin (USDC)',
  USDT: 'Tether (USDT)',
  BTC: 'Bitcoin (wBTC)',
  ETH: 'Ethereum (wETH)',
};

export const STABLE_ASSETS = new Set(['USDC', 'USDT']);

export const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString('en-US');

/** resolve the window [startIdx, endIdx] for a period selection */
export function resolveWindow(periodVal: string, a: AssetSeries): [number, number] {
  const L = a.prices.length;
  if (periodVal === 'cycle') {
    let bi = 0, mn = a.prices[0];
    for (let i = 0; i < L; i++) if (a.prices[i] < mn) { mn = a.prices[i]; bi = i; }
    let ti = bi, mx = a.prices[bi];
    for (let i = bi; i < L; i++) if (a.prices[i] > mx) { mx = a.prices[i]; ti = i; }
    if (ti <= bi) { bi = 0; ti = L - 1; }
    return [bi, ti];
  }
  const N = Number(periodVal);
  return [Math.max(0, L - N), L - 1];
}

export function computeSeries(
  a: AssetSeries,
  apyPct: number,
  startIdx: number,
  endIdx: number,
  monthlyContribution: number,
) {
  const r = (apyPct / 100) / 12;
  const n = endIdx - startIdx + 1;
  let qty = 0;
  const value: number[] = [];
  const contrib: number[] = [];
  for (let i = 0; i < n; i++) {
    const gi = startIdx + i;
    qty = (qty + monthlyContribution / a.prices[gi]) * (1 + r);
    const mark = gi === a.prices.length - 1 ? a.current : a.prices[gi];
    value.push(qty * mark);
    contrib.push(monthlyContribution * (i + 1));
  }
  return { value, contrib, invested: monthlyContribution * n, n };
}

// ---------- market data (via the earn-market function) ----------

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function market(body: Record<string, string | number>) {
  const res = await fetch(`${SB_URL}/functions/v1/earn-market`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`earn-market ${res.status}`);
  return res.json();
}

export interface MarketBundle {
  assets: Record<string, AssetSeries>;
  nloApr: number | null;
  syncedAt: string | null;
}

/** SOL / ETH / BTC monthly closes + the live NLO yield */
export async function loadMarket(): Promise<MarketBundle> {
  const [prices, nlo] = await Promise.allSettled([
    market({ action: 'prices' }),
    market({ action: 'nlo' }),
  ]);

  const assets: Record<string, AssetSeries> = {};
  let syncedAt: string | null = null;

  if (prices.status === 'fulfilled' && prices.value?.assets) {
    syncedAt = prices.value.syncedAt ?? null;
    for (const [sym, v] of Object.entries(prices.value.assets as Record<string, AssetSeries>)) {
      if (v?.prices?.length) assets[sym] = { ...v, name: ASSET_NAMES[sym] ?? sym };
    }
  }
  // stablecoins are flat by construction; length matches whatever we loaded
  const len = Object.values(assets)[0]?.prices.length ?? 48;
  const ref = Object.values(assets)[0];
  for (const sym of ['USDC', 'USDT']) {
    assets[sym] = {
      prices: Array(len).fill(1),
      current: 1,
      name: ASSET_NAMES[sym],
      startYear: ref?.startYear ?? new Date().getUTCFullYear() - 4,
      startMonth: ref?.startMonth ?? 0,
      stable: true,
    };
  }

  const nloApr =
    nlo.status === 'fulfilled' && Number.isFinite(nlo.value?.apr) ? Number(nlo.value.apr) : null;

  return { assets, nloApr, syncedAt };
}

/** full token list (symbol, name, coingecko/cmc ids) */
export async function loadTokens(): Promise<Array<{ sym: string; name: string; id?: string; cmcId?: number }>> {
  const data = await market({ action: 'tokens' });
  const rows = Array.isArray(data?.tokens) ? data.tokens : [];
  return rows.map((t: { sym: string; name: string; id?: string; cmcId?: number }) => ({
    sym: t.sym, name: t.name, id: t.id, cmcId: t.cmcId,
  }));
}

/** monthly closes for an arbitrary token (buy & hold mode) */
export async function loadTokenSeries(sym: string, id?: string): Promise<AssetSeries> {
  const data = await market({ action: 'history', sym, id: id ?? '' });
  if (!data?.prices?.length) throw new Error(`no price history for ${sym}`);
  return {
    prices: data.prices,
    current: data.current,
    name: `$${sym}`,
    startYear: data.startYear,
    startMonth: data.startMonth,
  };
}

// ---------- one-shot calculation ----------

export interface CalcInput {
  asset: string;
  platform?: string | null;
  amount: number;
  frequency: string;
  period: string;
}

export interface CalcResult {
  mode: 'defi' | 'token';
  asset: string;
  asset_name: string;
  platform: string | null;
  platform_handle: string | null;
  amount: number;
  frequency: string;
  period: string;
  window_label: string;
  months: number;
  apy_percent: number;
  yield_note: string;
  monthly_contribution: number;
  invested: number;
  final_value: number;
  profit: number;
  multiple: number;
  monthly_series: Array<{ month: string; contributed: number; value: number }>;
  summary: string;
  prices_synced_at: string | null;
  disclaimer: string;
}

export const DISCLAIMER =
  'Historical backtest using real monthly closes and representative average yields. Not financial advice.';

const MONTH_KEYS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export async function calculate(input: CalcInput): Promise<CalcResult> {
  const amount = Math.max(0, Number(input.amount) || 0);
  const frequency = input.frequency in FREQ ? input.frequency : 'Monthly';
  const period = PERIODS.includes(String(input.period)) ? String(input.period) : 'cycle';
  const freq = FREQ[frequency];
  const monthlyContribution = amount * freq.k;

  const wantedPlatform = input.platform ?? null;
  const isDefi = !!wantedPlatform;
  if (isDefi && !(wantedPlatform! in PLATFORMS)) {
    throw new Error(`unknown platform "${wantedPlatform}" — call /options for the valid list`);
  }

  const { assets, nloApr, syncedAt } = await loadMarket();
  const assetSym = (input.asset || '').toUpperCase();

  let series: AssetSeries;
  let apy = 0;
  let yieldNote = 'no yield';

  if (isDefi) {
    const cfg = PLATFORMS[wantedPlatform!];
    if (!cfg.assets.includes(assetSym)) {
      throw new Error(`${wantedPlatform} does not support ${assetSym} — supported: ${cfg.assets.join(', ')}`);
    }
    if (!assets[assetSym]?.prices?.length) throw new Error(`no price history for ${assetSym}`);
    series = assets[assetSym];
    apy = wantedPlatform === 'NLO by L1X' && nloApr ? nloApr : (cfg.apy[assetSym] ?? 0);
    yieldNote = cfg.yieldNote;
  } else {
    if (assets[assetSym]?.prices?.length) {
      series = assets[assetSym];
    } else {
      const tokens = await loadTokens();
      const match = tokens.find((t) => t.sym.toUpperCase() === assetSym);
      series = await loadTokenSeries(assetSym, match?.id);
      if (match?.name) series.name = `${match.name} ($${assetSym})`;
    }
  }

  const [startIdx, endIdx] = resolveWindow(period, series);
  const { value, contrib, invested, n } = computeSeries(series, apy, startIdx, endIdx, monthlyContribution);
  const finalVal = value[value.length - 1] ?? 0;

  const monthly_series = value.map((v, i) => {
    const d = new Date(series.startYear, series.startMonth + startIdx + i, 1);
    return {
      month: `${MONTH_KEYS[d.getMonth()]} ${d.getFullYear()}`,
      contributed: Math.round(contrib[i]),
      value: Math.round(v),
    };
  });

  const first = monthly_series[0]?.month ?? '';
  const last = monthly_series[monthly_series.length - 1]?.month ?? '';
  const window_label =
    period === 'cycle' ? `Bear bottom \u2192 Bull top (${first} \u2192 ${last})` : `Last ${period} months (${first} \u2192 ${last})`;

  const summary = isDefi
    ? `If you earned a $${fmt(amount)} bounty ${freq.per} and invested it into $${assetSym} on ${wantedPlatform} at ${apy.toFixed(2)}% ${yieldNote} over ${n} months (${window_label}), your total bounties earned is $${fmt(invested)} and it would now be worth $${fmt(finalVal)}.`
    : `If you earned a $${fmt(amount)} bounty ${freq.per} and bought $${assetSym} with it over ${n} months (${window_label}), your total bounties earned is $${fmt(invested)} and it would now be worth $${fmt(finalVal)}.`;

  return {
    mode: isDefi ? 'defi' : 'token',
    asset: assetSym,
    asset_name: series.name,
    platform: isDefi ? wantedPlatform! : null,
    platform_handle: isDefi ? (PLATFORM_X[wantedPlatform!] ?? null) : null,
    amount,
    frequency,
    period,
    window_label,
    months: n,
    apy_percent: Number(apy.toFixed(2)),
    yield_note: yieldNote,
    monthly_contribution: Math.round(monthlyContribution),
    invested: Math.round(invested),
    final_value: Math.round(finalVal),
    profit: Math.round(finalVal - invested),
    multiple: invested > 0 ? Number((finalVal / invested).toFixed(2)) : 0,
    monthly_series,
    summary,
    prices_synced_at: syncedAt,
    disclaimer: DISCLAIMER,
  };
}

/** the ready-to-post X copy, same shape the /earn page uses */
export function buildPostText(r: CalcResult) {
  const freq = FREQ[r.frequency];
  const step3 = r.mode === 'token'
    ? `Buy $${r.asset} and hold`
    : `Buy $${r.asset} stake on ${r.platform_handle ?? r.platform}`;
  const step4 = r.period === 'cycle'
    ? 'Repeat from Bear Market bottom to Bull Market Top'
    : `Repeat for ${r.period} months`;
  return [
    `My estimated earnings is $${fmt(r.final_value)} from crypto bounties`,
    '',
    'New Bounty Meta:',
    '1\ufe0f\u20e3 Search bounties on @AskRei_',
    `2\ufe0f\u20e3 Earn a $${fmt(r.amount)} bounty ${freq.per}`,
    `3\ufe0f\u20e3 ${step3}`,
    `4\ufe0f\u20e3 ${step4}`,
    '',
    'Check yours on rei.chat/earn',
  ].join('\n');
}
