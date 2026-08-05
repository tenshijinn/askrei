import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// earn-market: proxy + persistent cache for the /earn bounty->DeFi backtest card.
// actions:
//   "prices"  Coinbase monthly closes for SOL/ETH/BTC
//   "tokens"  full token list (logo + coingecko id), served from the DB cache
//   "history" per-token monthly closes + TGE, served from the DB cache
//   "warm"    one-off/cron job that fills the DB cache for every token
//   "nlo"     live Ultra-Safe APR
// Sources are tried in order: CoinGecko -> Coinbase -> CoinMarketCap.

const MEM_TTL_MS = 60 * 60 * 1000; // 1h in-memory
const DB_TTL_MS = 24 * 60 * 60 * 1000; // 24h persistent
const MONTHS_BACK = 48;

const mem = new Map<string, { at: number; data: unknown }>();
const memGet = (k: string) => {
  const hit = mem.get(k);
  return hit && Date.now() - hit.at < MEM_TTL_MS ? hit.data : null;
};
const memPut = (k: string, data: unknown) => {
  mem.set(k, { at: Date.now(), data });
  return data;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CMC_KEY = Deno.env.get('COINMARKETCAP_API_KEY') ?? '';


// ---------- persistent cache ----------
async function dbGet(key: string): Promise<{ data: unknown; updated_at: string } | null> {
  const res = await fetch(
    `${SB_URL}/rest/v1/earn_market_cache?key=eq.${encodeURIComponent(key)}&select=data,updated_at`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ data: unknown; updated_at: string }>;
  return rows[0] ?? null;
}

async function dbPut(key: string, data: unknown) {
  await fetch(`${SB_URL}/rest/v1/earn_market_cache`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ key, data, updated_at: new Date().toISOString() }),
  });
}

const fresh = (row: { updated_at: string } | null) =>
  !!row && Date.now() - new Date(row.updated_at).getTime() < DB_TTL_MS;

// ---------- helpers ----------
function monthStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** [ts, price] pairs -> monthly series anchored at the first available month. */
function toMonthly(rows: [number, number][]) {
  const byMonth = new Map<string, number>();
  for (const [ts, px] of rows) {
    const d = new Date(ts);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!byMonth.has(key)) byMonth.set(key, px);
  }
  const keys = [...byMonth.keys()].sort();
  const trimmed = keys.slice(Math.max(0, keys.length - MONTHS_BACK));
  if (!trimmed.length) return null;
  const [y, m] = trimmed[0].split('-').map(Number);
  return {
    prices: trimmed.map((k) => byMonth.get(k)!),
    current: rows[rows.length - 1][1],
    startYear: y,
    startMonth: m - 1,
  };
}

// ---------- Coinbase ----------
/** Coinbase daily candles paged in <=300-day chunks, downsampled to the 1st of each month. */
async function coinbaseMonthly(product: string) {
  const now = new Date();
  const end = monthStart(now);
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (MONTHS_BACK - 1), 1));

  const closes = new Map<string, number>();
  let cursor = new Date(start);
  while (cursor < now) {
    const chunkEnd = new Date(Math.min(now.getTime(), cursor.getTime() + 299 * 864e5));
    const url =
      `https://api.exchange.coinbase.com/products/${product}-USD/candles` +
      `?granularity=86400&start=${cursor.toISOString()}&end=${chunkEnd.toISOString()}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'rei-earn' } });
    if (res.ok) {
      const rows = (await res.json()) as number[][];
      for (const r of rows) closes.set(new Date(r[0] * 1000).toISOString().slice(0, 10), r[4]);
    }
    cursor = new Date(chunkEnd.getTime() + 864e5);
  }
  if (!closes.size) throw new Error(`no candles for ${product}`);

  const days = [...closes.keys()].sort();
  const prices: number[] = [];
  for (let i = 0; i < MONTHS_BACK; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const key = d.toISOString().slice(0, 10);
    let px = closes.get(key);
    if (px === undefined) {
      const found = days.find((x) => x >= key);
      px = found ? closes.get(found) : closes.get(days[days.length - 1]);
    }
    if (px !== undefined) prices.push(px);
  }
  return {
    prices,
    current: closes.get(days[days.length - 1])!,
    startYear: start.getUTCFullYear(),
    startMonth: start.getUTCMonth(),
  };
}

// ---------- CoinGecko ----------
async function cgTokens() {
  const out: TokenRow[] = [];
  for (const page of [1, 2]) {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem' +
        `&order=market_cap_desc&per_page=250&page=${page}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) {
      if (out.length) break;
      throw new Error(`coingecko markets HTTP ${res.status}`);
    }
    const rows = (await res.json()) as Array<{
      id: string; symbol: string; name: string; image: string; market_cap: number;
    }>;
    if (!rows.length) break;
    for (const r of rows) {
      out.push({
        id: r.id,
        sym: (r.symbol || '').toUpperCase(),
        name: r.name,
        logo: r.image,
        mcap: r.market_cap,
        source: 'coingecko',
      });
    }
    if (rows.length < 250) break;
  }
  return out;
}

async function cgHistory(id: string) {
  // Free CoinGecko rejects days=max and the interval param (paid-only).
  for (const days of ['365', '180', '90']) {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) continue;
    const data = (await res.json()) as { prices: [number, number][] };
    const monthly = data?.prices?.length ? toMonthly(data.prices) : null;
    if (monthly) return monthly;
  }
  throw new Error('coingecko chart unavailable');
}

// ---------- CoinMarketCap ----------
interface TokenRow {
  id?: string;
  sym: string;
  name: string;
  logo?: string;
  mcap?: number;
  cmcId?: number;
  source?: string;
}

async function cmcTokens(): Promise<TokenRow[]> {
  if (!CMC_KEY) throw new Error('no CMC key');
  const res = await fetch(
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=500&sort=market_cap&convert=USD',
    { headers: { 'X-CMC_PRO_API_KEY': CMC_KEY, Accept: 'application/json' } },
  );
  if (!res.ok) throw new Error(`cmc listings HTTP ${res.status}`);
  const body = (await res.json()) as {
    data: Array<{ id: number; symbol: string; name: string; platform?: { name?: string }; quote: { USD: { market_cap: number } } }>;
  };
  return (body.data ?? [])
    .filter((r) => !r.platform?.name || /solana/i.test(r.platform.name))
    .map((r) => ({
      cmcId: r.id,
      sym: (r.symbol || '').toUpperCase(),
      name: r.name,
      logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${r.id}.png`,
      mcap: r.quote?.USD?.market_cap,
      source: 'cmc',
    }));
}

async function cmcHistory(cmcId: number) {
  if (!CMC_KEY) throw new Error('no CMC key');
  const end = new Date();
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (MONTHS_BACK - 1), 1));
  const res = await fetch(
    'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/historical' +
      `?id=${cmcId}&interval=monthly&count=${MONTHS_BACK}&time_start=${start.toISOString()}&convert=USD`,
    { headers: { 'X-CMC_PRO_API_KEY': CMC_KEY, Accept: 'application/json' } },
  );
  if (!res.ok) throw new Error(`cmc historical HTTP ${res.status}`);
  const body = (await res.json()) as {
    data?: { quotes?: Array<{ timestamp: string; quote: { USD: { price: number } } }> };
  };
  const rows: [number, number][] = (body.data?.quotes ?? [])
    .map((q) => [new Date(q.timestamp).getTime(), q.quote?.USD?.price] as [number, number])
    .filter(([, px]) => Number.isFinite(px));
  const monthly = toMonthly(rows);
  if (!monthly) throw new Error('cmc historical empty');
  return monthly;
}


const COINBASE_SYMS = new Set(['SOL', 'ETH', 'BTC', 'WBTC', 'WETH', 'JUP', 'JTO', 'BONK', 'RENDER', 'HNT', 'PYTH', 'RAY', 'ORCA', 'W', 'IO', 'MOBILE', 'DRIFT', 'TNSR', 'WIF', 'POPCAT', 'MEW', 'PENGU', 'SHDW', 'MPLX']);

/** history with the full fallback chain */
async function tokenHistory(t: { id?: string; sym: string; cmcId?: number }) {
  const attempts: Array<() => Promise<ReturnType<typeof toMonthly>>> = [];
  if (t.id) attempts.push(() => cgHistory(t.id!));
  if (COINBASE_SYMS.has(t.sym.toUpperCase())) {
    const product = t.sym.toUpperCase().replace(/^W(BTC|ETH)$/, '$1');
    attempts.push(() => coinbaseMonthly(product));
  }
  if (t.cmcId) attempts.push(() => cmcHistory(t.cmcId!));

  let lastErr = 'no source';
  for (const run of attempts) {
    try {
      const r = await run();
      if (r?.prices?.length) return r;
    } catch (e) {
      lastErr = (e as Error).message;
    }
  }
  throw new Error(lastErr);
}

// ---------- token list with fallbacks ----------
async function buildTokens(): Promise<TokenRow[]> {
  const bySym = new Map<string, TokenRow>();
  const merge = (rows: TokenRow[]) => {
    for (const r of rows) {
      if (!r.sym) continue;
      const prev = bySym.get(r.sym);
      bySym.set(r.sym, prev ? { ...r, ...prev, logo: prev.logo ?? r.logo, cmcId: prev.cmcId ?? r.cmcId, id: prev.id ?? r.id } : r);
    }
  };
  const results = await Promise.allSettled([cgTokens(), cmcTokens()]);
  for (const r of results) if (r.status === 'fulfilled') merge(r.value);
  if (!bySym.size) throw new Error('no token source available');
  return [...bySym.values()].sort((a, b) => (b.mcap ?? 0) - (a.mcap ?? 0));
}

// ---------- NLO live yield ----------
const FIRECRAWL_KEY = Deno.env.get('FIRECRAWL_API_KEY') ?? '';

function pickYield(text: string): number | null {
  // markdown: "Verified accuracy ... ~84.2% ... verified in hindsight"
  const near = text.match(/Verified accuracy[\s\S]{0,400}?~?(\d{1,3}(?:\.\d+)?)\s*%/i);
  const wire = text.match(/data-wire="accuracy\.pct"[^>]*>~?(\d{1,3}(?:\.\d+)?)\s*%/i);
  const raw = Number(wire?.[1] ?? near?.[1]);
  return Number.isFinite(raw) && raw > 0 && raw <= 1000 ? raw : null;
}

async function scrapeNloYield(): Promise<number | null> {
  // 1) Firecrawl (renders the live JS value)
  if (FIRECRAWL_KEY) {
    try {
      const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
        method: 'POST',
        headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://nlo.finance/live', formats: ['markdown'], onlyMainContent: false, waitFor: 4000 }),
      });
      if (res.ok) {
        const body = await res.json();
        const md = body?.markdown ?? body?.data?.markdown ?? '';
        const v = pickYield(String(md));
        if (v !== null) return v;
      } else {
        console.warn('[earn-market] firecrawl nlo HTTP', res.status, await res.text());
      }
    } catch (e) {
      console.warn('[earn-market] firecrawl nlo failed:', (e as Error).message);
    }
  }
  // 2) plain HTML fallback (server-rendered baseline)
  try {
    const res = await fetch('https://nlo.finance/live', { headers: { 'User-Agent': 'rei-earn' } });
    if (res.ok) return pickYield(await res.text());
  } catch (e) {
    console.warn('[earn-market] nlo html failed:', (e as Error).message);
  }
  return null;
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let action = url.searchParams.get('action') ?? '';
    let id = url.searchParams.get('id') ?? '';
    let sym = url.searchParams.get('sym') ?? '';
    let limit = Number(url.searchParams.get('limit') ?? 0);
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      action = body.action ?? action;
      id = body.id ?? id;
      sym = body.sym ?? sym;
      limit = Number(body.limit ?? limit);
    }

    if (action === 'prices') {
      const hit = memGet('prices');
      if (hit) return json(hit);
      const row = await dbGet('prices');
      if (fresh(row)) return json(memPut('prices', row!.data));

      const products = ['SOL', 'ETH', 'BTC'];
      const results = await Promise.allSettled(products.map((p) => coinbaseMonthly(p)));
      const assets: Record<string, unknown> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') assets[products[i]] = r.value;
      });
      if (!Object.keys(assets).length) {
        if (row) return json(row.data); // stale beats nothing
        return json({ error: 'no price sources available' }, 502);
      }
      const payload = { assets, syncedAt: new Date().toISOString() };
      await dbPut('prices', payload);
      return json(memPut('prices', payload));
    }

    if (action === 'tokens') {
      const hit = memGet('tokens');
      if (hit) return json(hit);
      const row = await dbGet('tokens');
      if (fresh(row)) return json(memPut('tokens', row!.data));
      try {
        const tokens = await buildTokens();
        const payload = { tokens, syncedAt: new Date().toISOString() };
        await dbPut('tokens', payload);
        return json(memPut('tokens', payload));
      } catch (e) {
        console.warn('[earn-market] tokens failed:', (e as Error).message);
        if (row) return json(row.data); // serve stale rather than nothing
        return json({ tokens: [], unavailable: true });
      }
    }

    if (action === 'history') {
      if ((!id && !sym) || id.length > 80 || sym.length > 40) return json({ error: 'id or sym is required' }, 400);
      const key = `history:${id || sym}`;
      const hit = memGet(key);
      if (hit) return json(hit);
      const row = await dbGet(key);
      if (fresh(row)) return json(memPut(key, row!.data));

      // resolve cmcId from the cached token list for the fallback chain
      let cmcId: number | undefined;
      const tokRow = await dbGet('tokens');
      const tokens = (tokRow?.data as { tokens?: TokenRow[] } | undefined)?.tokens ?? [];
      const match = tokens.find((t) => (id && t.id === id) || (sym && t.sym === sym.toUpperCase()));
      cmcId = match?.cmcId;

      try {
        const series = await tokenHistory({ id: id || match?.id, sym: sym || match?.sym || '', cmcId });
        const payload = { ...series, syncedAt: new Date().toISOString() };
        await dbPut(key, payload);
        return json(memPut(key, payload));
      } catch (e) {
        console.warn('[earn-market] history failed:', (e as Error).message);
        if (row) return json(row.data);
        return json({ unavailable: true, error: (e as Error).message });
      }
    }

    // one-off / cron warmer: fills the DB cache so the UI never hits a provider live
    if (action === 'warm') {
      let tokens: TokenRow[] = [];
      try {
        tokens = await buildTokens();
        await dbPut('tokens', { tokens, syncedAt: new Date().toISOString() });
      } catch (_) {
        const row = await dbGet('tokens');
        tokens = (row?.data as { tokens?: TokenRow[] } | undefined)?.tokens ?? [];
      }
      const target = tokens.slice(0, limit > 0 ? Math.min(limit, 250) : 60);
      let ok = 0;
      let failed = 0;
      for (const t of target) {
        const key = `history:${t.id || t.sym}`;
        const row = await dbGet(key);
        if (fresh(row)) { ok++; continue; }
        try {
          const series = await tokenHistory(t);
          await dbPut(key, { ...series, syncedAt: new Date().toISOString() });
          ok++;
        } catch (_) {
          failed++;
        }
        await new Promise((r) => setTimeout(r, 1500)); // stay under provider rate limits
      }
      return json({ tokens: tokens.length, warmed: ok, failed });
    }

    // NLO by L1X yield: sampled once per day from nlo.finance/live ("Verified
    // accuracy" card) and returned as a rolling 30-day average.
    if (action === 'nlo') {
      const hit = memGet('nlo');
      if (hit) return json(hit);

      const today = new Date().toISOString().slice(0, 10);
      const row = await dbGet('nlo:samples');
      const store = (row?.data as { samples?: Array<{ date: string; apr: number }> } | undefined) ?? {};
      let samples = (store.samples ?? []).filter((s) => Number.isFinite(s.apr));

      if (!samples.some((s) => s.date === today)) {
        const live = await scrapeNloYield();
        if (live !== null) {
          samples = [...samples.filter((s) => s.date !== today), { date: today, apr: live }];
          const cutoff = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
          samples = samples.filter((s) => s.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
          await dbPut('nlo:samples', { samples });
        }
      }

      const apr = samples.length
        ? samples.reduce((a, s) => a + s.apr, 0) / samples.length
        : null;
      const payload = {
        apr,
        latest: samples.length ? samples[samples.length - 1].apr : null,
        samples: samples.length,
        windowDays: 30,
        syncedAt: new Date().toISOString(),
      };
      return json(memPut('nlo', payload));
    }


    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    console.error('[earn-market]', e);
    return json({ error: (e as Error).message }, 500);
  }
});
