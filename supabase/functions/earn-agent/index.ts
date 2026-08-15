// earn-agent: internal-key HTTP API that exposes the /earn Bounty Earning
// Calculator to the Hermes agent, with a server-rendered share card.
//
//   GET  /earn-agent/options    valid assets, platforms, frequencies, periods
//   POST /earn-agent/calculate  run the backtest (optionally with share:true)
//   POST /earn-agent/share      backtest + share card PNG + /s/<id> link
//
// Auth: x-internal-key header must match REI_AGENT_INTERNAL_KEY.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  ASSET_NAMES,
  DISCLAIMER,
  FREQ,
  PERIODS,
  PLATFORMS,
  PLATFORM_X,
  buildPostText,
  calculate,
  loadTokens,
  type CalcResult,
} from '../_shared/earn-calc.ts';
import { renderCardPng } from '../_shared/earn-card.ts';

const SITE = 'https://rei.chat';
const BUCKET = 'earn-share-cards';
const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const INTERNAL_KEY = Deno.env.get('REI_AGENT_INTERNAL_KEY') ?? '';

const HEADERS = {
  ...corsHeaders,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-key',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
  });

// ---------- rate limit: 60 requests / minute per key ----------
const RATE_MAX = 60;
const hits: number[] = [];
function rateLimited() {
  const now = Date.now();
  while (hits.length && now - hits[0] > 60_000) hits.shift();
  if (hits.length >= RATE_MAX) return true;
  hits.push(now);
  return false;
}

function shortId() {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

interface Body {
  asset?: unknown;
  platform?: unknown;
  amount?: unknown;
  frequency?: unknown;
  period?: unknown;
  share?: unknown;
  include_series?: unknown;
}

function readInput(body: Body) {
  const asset = typeof body.asset === 'string' ? body.asset.trim() : '';
  if (!asset) throw new Error('asset is required (e.g. "SOL") — call /options for the valid list');
  const rawPlatform = typeof body.platform === 'string' && body.platform.trim() ? body.platform.trim() : null;
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be a positive number of USD');
  if (amount > 1_000_000) throw new Error('amount must be 1,000,000 or less');
  const frequency = typeof body.frequency === 'string' ? body.frequency : 'Monthly';
  if (!(frequency in FREQ)) throw new Error(`frequency must be one of: ${Object.keys(FREQ).join(', ')}`);
  const period = String(body.period ?? 'cycle');
  if (!PERIODS.includes(period)) throw new Error(`period must be one of: ${PERIODS.join(', ')}`);
  return { asset, platform: rawPlatform, amount, frequency, period };
}

async function createShare(result: CalcResult) {
  const supabase = createClient(SB_URL, SB_SERVICE);
  const id = shortId();
  let imagePath: string | null = null;

  try {
    const png = await renderCardPng(result);
    const path = `${id}.png`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, png, { contentType: 'image/png', upsert: true });
    if (error) console.error('[earn-agent] card upload failed', error.message);
    else imagePath = path;
  } catch (e) {
    console.error('[earn-agent] card render failed', (e as Error).message);
  }

  const state = {
    assetSym: result.asset,
    platform: result.platform,
    amount: result.amount,
    frequency: result.frequency,
    period: result.period,
    invested: result.invested,
    finalVal: result.final_value,
    windowLabel: result.window_label,
    source: 'hermes',
  };

  const { error } = await supabase.from('earn_shares').insert({ id, state, image_path: imagePath });
  if (error) throw new Error(`could not save share: ${error.message}`);

  return {
    share_id: id,
    share_url: `${SITE}/s/${id}`,
    image_url: imagePath ? `${SB_URL}/functions/v1/share-card/image?id=${id}` : null,
    post_text: buildPostText(result),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: HEADERS });

  const url = new URL(req.url);
  const route = url.pathname.replace(/^.*\/earn-agent/, '').replace(/\/+$/, '') || '/';

  if (!INTERNAL_KEY) return json({ error: 'Endpoint not configured' }, 503);
  const provided = (req.headers.get('x-internal-key') ?? '').trim();
  if (!provided || !timingSafeEqual(provided, INTERNAL_KEY)) {
    return json({ error: 'Invalid or missing x-internal-key' }, 401);
  }
  if (rateLimited()) return json({ error: 'Rate limit exceeded (60 requests/minute)' }, 429);

  try {
    if (route === '/health') {
      return json({ ok: true, service: 'earn-agent', routes: ['/options', '/calculate', '/share'] });
    }

    if (route === '/options') {
      let tokens: Array<{ sym: string; name: string }> = [];
      try {
        tokens = (await loadTokens()).slice(0, 120).map((t) => ({ sym: t.sym, name: t.name }));
      } catch (_) {
        tokens = Object.keys(ASSET_NAMES).map((s) => ({ sym: s, name: ASSET_NAMES[s] }));
      }
      return json({
        platforms: Object.entries(PLATFORMS).map(([name, cfg]) => ({
          name,
          assets: cfg.assets,
          apy_percent: cfg.apy,
          yield_note: cfg.yieldNote,
          x_handle: PLATFORM_X[name] ?? null,
        })),
        frequencies: Object.keys(FREQ),
        periods: PERIODS.map((p) => ({
          value: p,
          label: p === 'cycle' ? 'Bear bottom \u2192 Bull top' : `Last ${p} months`,
        })),
        defi_assets: Object.entries(ASSET_NAMES).map(([sym, name]) => ({ sym, name })),
        buy_and_hold_tokens: tokens,
        notes: [
          'Set platform for the DeFi (stake/lend) mode; omit platform for buy & hold of any token in buy_and_hold_tokens.',
          'amount is the USD value of one bounty; frequency is how often you earn it.',
        ],
        disclaimer: DISCLAIMER,
      });
    }

    if (route === '/calculate' || route === '/share') {
      if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);
      const body = (await req.json().catch(() => null)) as Body | null;
      if (!body || typeof body !== 'object') return json({ error: 'Invalid JSON body' }, 400);

      const input = readInput(body);
      const result = await calculate(input);

      const wantShare = route === '/share' || body.share === true;
      const share = wantShare ? await createShare(result) : null;

      const payload: Record<string, unknown> = { ...result };
      if (body.include_series === false) delete payload.monthly_series;
      if (share) Object.assign(payload, share);
      if (!wantShare) payload.post_text = buildPostText(result);
      return json(payload);
    }

    return json({ error: `Unknown route "${route}"`, routes: ['/options', '/calculate', '/share', '/health'] }, 404);
  } catch (e) {
    const msg = (e as Error).message ?? 'unexpected error';
    console.error('[earn-agent]', msg);
    const clientError = /required|must be|unknown platform|does not support|no price history/i.test(msg);
    return json({ error: msg }, clientError ? 400 : 500);
  }
});
