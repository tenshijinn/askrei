// ===== real monthly close prices (Coinbase), Aug 2022 -> Jul 2026 =====
// 48 monthly closes, index 0 = Aug 2022. Real Coinbase data (seed snapshot).
export const SOL = [41.67,31.62,32.44,32.20,13.52,9.99,25.00,22.51,21.09,21.96,20.51,18.70,24.05,19.33,23.87,41.18,59.77,110.11,97.78,129.53,192.35,134.46,165.99,146.52,
  167.22,128.50,145.10,166.02,236.95,193.84,212.94,143.59,126.69,150.89,157.76,146.92,162.66,197.32,222.15,186.26,126.66,126.73,100.66,90.88,81.17,84.26,74.12,80.63];

export const ETH = [1630.82,1586.23,1311.76,1578.24,1276.48,1199.92,1642.05,1665.20,1821.73,1831.41,1862.43,1924.14,1872.89,1628.46,1733.40,1847.74,2088.40,2352.76,2303.61,3436.00,3505.85,2968.12,3812.48,3438.59,
  3200.54,2425.90,2447.55,2510.27,3710.24,3353.32,3116.78,2216.51,1905.13,1838.82,2540.38,2405.32,3486.39,4314.76,4350.52,3872.16,2798.30,3000.41,2268.18,2127.61,2140.21,2316.89,1857.32,1698.63];

export const BTC = [23273.86,20133.65,19315.27,20479.63,16980.08,16611.58,23735.97,23631.52,28471.46,28077.27,26828.42,30587.21,29697.27,25794.88,27995.46,35440.10,38703.54,44220.78,43078.81,61179.03,69681.82,58265.59,67719.29,62830.13,
  65288.18,57299.00,60790.00,69467.29,97263.18,94383.59,100623.85,86018.76,85170.37,96524.98,105697.94,105711.78,113248.73,109240.55,118659.97,110052.25,86282.36,88738.34,76895.53,72683.26,68112.35,78682.31,66658.35,61484.02];

export const STABLE = Array(48).fill(1);

export interface AssetSeries {
  prices: number[];
  current: number;
  name: string;
  logoBg: string;
  /** month index 0 of `prices`, as a calendar month */
  startYear: number;
  startMonth: number; // 0-11
  stable?: boolean;
}

// Aug 2022 = index 0 for the seed snapshot
export const SEED_START_YEAR = 2022;
export const SEED_START_MONTH = 7;

const seed = { startYear: SEED_START_YEAR, startMonth: SEED_START_MONTH };

export const SEED_ASSETS: Record<string, AssetSeries> = {
  SOL:  { prices: SOL,    current: 73.28,    name: 'Solana (SOL)',    logoBg: '#17130f',     ...seed },
  USDC: { prices: STABLE, current: 1,        name: 'USD Coin (USDC)', logoBg: 'transparent', ...seed, stable: true },
  USDT: { prices: STABLE, current: 1,        name: 'Tether (USDT)',   logoBg: 'transparent', ...seed, stable: true },
  BTC:  { prices: BTC,    current: 62858.93, name: 'Bitcoin (wBTC)',  logoBg: 'transparent', ...seed },
  ETH:  { prices: ETH,    current: 1863.91,  name: 'Ethereum (wETH)', logoBg: 'transparent', ...seed },
};

// platforms in requested order. Staking (Jito, Marinade) = SOL only; lending
// (Kamino, marginfi) = many assets. Yields are representative period-average APY
// per asset. NLO by L1X = live "Ultra-Safe" APR read from nlo.finance.
export interface Platform {
  assets: string[];
  apy: Record<string, number>;
  verb: string;
  yieldNote: string;
}

export const PLATFORMS: Record<string, Platform> = {
  'Jito':       { assets: ['SOL'],                            apy: { SOL: 8.0 },                                            verb: 'Staked with Jito',       yieldNote: 'avg staking yield' },
  'Kamino':     { assets: ['USDC','USDT','SOL','BTC','ETH'],  apy: { USDC: 7.5, USDT: 7.0, SOL: 3.0, BTC: 0.5, ETH: 1.5 },  verb: 'Lent on Kamino',         yieldNote: 'avg lending yield' },
  'Marinade':   { assets: ['SOL'],                            apy: { SOL: 7.2 },                                            verb: 'Staked with Marinade',   yieldNote: 'avg staking yield' },
  'marginfi':   { assets: ['USDC','USDT','SOL','BTC','ETH'],  apy: { USDC: 5.5, USDT: 5.0, SOL: 2.5, BTC: 0.4, ETH: 1.2 },  verb: 'Lent on marginfi',       yieldNote: 'avg lending yield' },
  'NLO by L1X': { assets: ['USDC'],                           apy: { USDC: 273.37 },                                        verb: 'Auto-compounded on NLO', yieldNote: 'live Ultra-Safe APR' },
};

export const LETTER = ['J','F','M','A','M','J','J','A','S','O','N','D'];

// contribution cadence: k = contributions per month; per = sentence wording
export const FREQ: Record<string, { k: number; per: string }> = {
  'Weekly':    { k: 52 / 12, per: 'per week' },
  'Bi-Weekly': { k: 26 / 12, per: 'bi-weekly' },
  'Monthly':   { k: 1,       per: 'per month' },
};

export const fmt = (n: number) =>
  Math.round(Math.abs(n)).toLocaleString('en-US').replace(/,/g, ' ');

export interface TokenRow {
  sym: string;
  name: string;
  /** embedded price-series key (seed backtest) */
  data?: string;
  /** coingecko id when loaded live */
  id?: string;
  /** square icon url (same size for every asset) */
  logo?: string;
  cmcId?: number;
  mcap?: number;
}

/** square, equally-proportioned icons for the built-in assets */
export const ASSET_LOGO_URL: Record<string, string> = {
  SOL: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
};

// Top SVM tokens (seed list). `data` = embedded series; the rest load live.
export const SEED_TOKENS: TokenRow[] = [
  { sym: 'SOL', name: 'Solana', data: 'SOL', logo: ASSET_LOGO_URL.SOL },
  { sym: 'wBTC', name: 'Bitcoin (Wormhole)', data: 'BTC', logo: ASSET_LOGO_URL.BTC },
  { sym: 'wETH', name: 'Ethereum (Wormhole)', data: 'ETH', logo: ASSET_LOGO_URL.ETH },
  { sym: 'USDC', name: 'USD Coin', data: 'USDC', logo: ASSET_LOGO_URL.USDC },
  { sym: 'USDT', name: 'Tether', data: 'USDT', logo: ASSET_LOGO_URL.USDT },
  { sym: 'JUP', name: 'Jupiter' }, { sym: 'JTO', name: 'Jito' }, { sym: 'BONK', name: 'Bonk' }, { sym: 'WIF', name: 'dogwifhat' },
  { sym: 'PYTH', name: 'Pyth Network' }, { sym: 'RAY', name: 'Raydium' }, { sym: 'JLP', name: 'Jupiter LP' },
  { sym: 'RENDER', name: 'Render' }, { sym: 'HNT', name: 'Helium' }, { sym: 'W', name: 'Wormhole' }, { sym: 'PYUSD', name: 'PayPal USD' },
  { sym: 'ORCA', name: 'Orca' }, { sym: 'DRIFT', name: 'Drift' }, { sym: 'KMNO', name: 'Kamino' }, { sym: 'MNDE', name: 'Marinade' },
  { sym: 'TNSR', name: 'Tensor' }, { sym: 'IO', name: 'io.net' }, { sym: 'MOBILE', name: 'Helium Mobile' }, { sym: 'PENGU', name: 'Pudgy Penguins' },
  { sym: 'POPCAT', name: 'Popcat' }, { sym: 'MEW', name: 'cat in a dogs world' }, { sym: 'BOME', name: 'Book of Meme' }, { sym: 'WEN', name: 'Wen' },
  { sym: 'CLOUD', name: 'Cloud' }, { sym: 'ZEUS', name: 'Zeus Network' }, { sym: 'SLND', name: 'Save (Solend)' }, { sym: 'FIDA', name: 'Bonfida' },
  { sym: 'SAMO', name: 'Samoyedcoin' }, { sym: 'STEP', name: 'Step Finance' }, { sym: 'ATLAS', name: 'Star Atlas' }, { sym: 'POLIS', name: 'Star Atlas DAO' },
  { sym: 'AURY', name: 'Aurory' }, { sym: 'GENE', name: 'Genopets' }, { sym: 'SHDW', name: 'Shadow' }, { sym: 'SBR', name: 'Saber' },
  { sym: 'PRCL', name: 'Parcl' }, { sym: 'NEON', name: 'Neon EVM' }, { sym: 'HXRO', name: 'Hxro' }, { sym: 'GOFX', name: 'GooseFX' },
  { sym: 'MPLX', name: 'Metaplex' }, { sym: 'DFL', name: 'DeFi Land' }, { sym: 'FORGE', name: 'Blocksmith Labs' }, { sym: 'CROWN', name: 'Crown' },
];

// ---------- math (preserved verbatim from the prototype) ----------

/** Catmull-Rom -> cubic bezier, for smooth line-chart edges */
export function smoothPath(p: [number, number][]): string {
  if (!p.length) return '';
  if (p.length < 3) return 'M' + p.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' L');
  let d = 'M' + p[0][0].toFixed(1) + ',' + p[0][1].toFixed(1);
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
  }
  return d;
}

/** resolve the window [startIdx, endIdx] for a period selection. Index 0 == TGE. */
export function resolveWindow(periodVal: string, a: AssetSeries): [number, number] {
  const L = a.prices.length, tge = 0;
  if (periodVal === 'cycle') {
    let bi = tge, mn = a.prices[tge];
    for (let i = tge; i < L; i++) { if (a.prices[i] < mn) { mn = a.prices[i]; bi = i; } }
    let ti = bi, mx = a.prices[bi];
    for (let i = bi; i < L; i++) { if (a.prices[i] > mx) { mx = a.prices[i]; ti = i; } }
    if (ti <= bi) { bi = tge; ti = L - 1; }   // flat (e.g. stablecoin): full range
    return [bi, ti];
  }
  const N = +periodVal;
  return [Math.max(tge, L - N), L - 1];       // last N months, clamped to TGE
}

export function computeSeries(a: AssetSeries, apyPct: number, startIdx: number, endIdx: number, monthlyContribution: number) {
  const r = (apyPct / 100) / 12;
  const n = endIdx - startIdx + 1;
  let qty = 0;
  const value: number[] = [], contrib: number[] = [];
  for (let i = 0; i < n; i++) {
    const gi = startIdx + i;
    qty = (qty + monthlyContribution / a.prices[gi]) * (1 + r);
    const mark = (gi === a.prices.length - 1) ? a.current : a.prices[gi];  // latest month at current price
    value.push(qty * mark);
    contrib.push(monthlyContribution * (i + 1));
  }
  return { value, contrib, invested: monthlyContribution * n, startIdx, n };
}

/** X handles for the DeFi platforms (used by the Post-to-X share text) */
export const PLATFORM_X: Record<string, string> = {
  'Jito': '@jito',
  'Kamino': '@Kamino',
  'Marinade': '@MarinadeFinance',
  'marginfi': '@marginfi',
  'NLO by L1X': '@NLOFinance',
};
