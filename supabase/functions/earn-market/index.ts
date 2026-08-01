import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// earn-market: proxy + cache for the /earn bounty->DeFi backtest card.
// actions: "prices" (Coinbase monthly closes for SOL/ETH/BTC), "tokens" (top SVM
// tokens from CoinGecko), "history" (per-token monthly closes + TGE), "nlo" (live APR).

const TTL_MS = 60 * 60 * 1000; // 1h
const cache = new Map<string, { at: number; data: unknown }>();

function cached(key: string) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  return null;
}
function put(key: string, data: unknown) {
  cache.set(key, { at: Date.now(), data });
  return data;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const MONTHS_BACK = 48;

function monthStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** Coinbase daily candles paged in <=300-day chunks, downsampled to the 1st of each month. */
async function coinbaseMonthly(product: string) {
  const now = new Date();
  const end = monthStart(now);
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (MONTHS_BACK - 1), 1));

  const closes = new Map<string, number>(); // YYYY-MM-DD -> close
  let cursor = new Date(start);
  while (cursor < now) {
    const chunkEnd = new Date(Math.min(now.getTime(), cursor.getTime() + 299 * 864e5));
    const url =
      `https://api.exchange.coinbase.com/products/${product}-USD/candles` +
      `?granularity=86400&start=${cursor.toISOString()}&end=${chunkEnd.toISOString()}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'rei-earn' } });
    if (res.ok) {
      const rows = (await res.json()) as number[][];
      for (const r of rows) {
        const day = new Date(r[0] * 1000).toISOString().slice(0, 10);
        closes.set(day, r[4]);
      }
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
      // nearest available day at/after the 1st
      const found = days.find((x) => x >= key);
      px = found ? closes.get(found) : closes.get(days[days.length - 1]);
    }
    if (px !== undefined) prices.push(px);
  }
  const current = closes.get(days[days.length - 1])!;
  return {
    prices,
    current,
    startYear: start.getUTCFullYear(),
    startMonth: start.getUTCMonth(),
  };
}

async function cgTokens() {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem&order=market_cap_desc&per_page=250&page=1',
    { headers: { Accept: 'application/json' } },
  );
  if (!res.ok) throw new Error(`coingecko markets HTTP ${res.status}`);
  const rows = (await res.json()) as Array<{ id: string; symbol: string; name: string; market_cap: number }>;
  return rows.map((r) => ({
    id: r.id,
    sym: (r.symbol || '').toUpperCase(),
    name: r.name,
    mcap: r.market_cap,
  }));
}

async function cgHistory(id: string) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=max&interval=daily`,
    { headers: { Accept: 'application/json' } },
  );
  if (!res.ok) throw new Error(`coingecko chart HTTP ${res.status}`);
  const data = (await res.json()) as { prices: [number, number][] };
  const rows = data.prices ?? [];
  if (!rows.length) throw new Error('no history');

  // first price of each month = monthly close series anchored at the token's TGE month
  const byMonth = new Map<string, number>();
  for (const [ts, px] of rows) {
    const d = new Date(ts);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!byMonth.has(key)) byMonth.set(key, px);
  }
  const keys = [...byMonth.keys()].sort();
  const trimmed = keys.slice(Math.max(0, keys.length - MONTHS_BACK));
  const [y, m] = trimmed[0].split('-').map(Number);
  return {
    prices: trimmed.map((k) => byMonth.get(k)!),
    current: rows[rows.length - 1][1],
    startYear: y,
    startMonth: m - 1,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let action = url.searchParams.get('action') ?? '';
    let id = url.searchParams.get('id') ?? '';
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      action = body.action ?? action;
      id = body.id ?? id;
    }

    if (action === 'prices') {
      const hit = cached('prices');
      if (hit) return json(hit);
      const products = ['SOL', 'ETH', 'BTC'];
      const results = await Promise.allSettled(products.map((p) => coinbaseMonthly(p)));
      const assets: Record<string, unknown> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') assets[products[i]] = r.value;
        else console.warn(`[earn-market] ${products[i]} failed:`, (r.reason as Error)?.message);
      });
      if (!Object.keys(assets).length) return json({ error: 'no price sources available' }, 502);
      return json(put('prices', { assets, syncedAt: new Date().toISOString() }));
    }

    if (action === 'tokens') {
      const hit = cached('tokens');
      if (hit) return json(hit);
      const tokens = await cgTokens();
      return json(put('tokens', { tokens, syncedAt: new Date().toISOString() }));
    }

    if (action === 'history') {
      if (!id || id.length > 80) return json({ error: 'id is required' }, 400);
      const key = `history:${id}`;
      const hit = cached(key);
      if (hit) return json(hit);
      const series = await cgHistory(id);
      return json(put(key, { ...series, syncedAt: new Date().toISOString() }));
    }

    if (action === 'nlo') {
      const hit = cached('nlo');
      if (hit) return json(hit);
      let apr: number | null = null;
      try {
        const res = await fetch('https://api.nlo.finance/v1/vaults', { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data?.vaults ?? []);
          const ultra = list.find((v: Record<string, unknown>) =>
            String(v?.name ?? v?.strategy ?? '').toLowerCase().includes('ultra'),
          );
          const raw = Number(ultra?.apr ?? ultra?.apy);
          if (Number.isFinite(raw) && raw > 0) apr = raw;
        }
      } catch (_) { /* fall through to placeholder */ }
      return json(put('nlo', { apr, syncedAt: new Date().toISOString() }));
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    console.error('[earn-market]', e);
    return json({ error: (e as Error).message }, 500);
  }
});
