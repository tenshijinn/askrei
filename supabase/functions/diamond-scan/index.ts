// Public /diamond scanner: score any wallet with Rei's Diamonds engine.
// Limited to 5 scans per IP per rolling week. Read-only — nothing persisted
// except the hashed-IP usage counter (shared ask_public_usage table, own salt).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { normalizeMoralis, type MoralisRawBundle } from '../_shared/diamonds/providers/moralis.ts';
import { fetchHeliusSignals } from '../_shared/diamonds/providers/helius.ts';
import { fetchBirdeyeSignals } from '../_shared/diamonds/providers/birdeye.ts';
import { fetchAlchemySignals } from '../_shared/diamonds/providers/alchemy.ts';
import { fetchBlockscoutSignals } from '../_shared/diamonds/providers/blockscout.ts';
import { computeDiamonds, mergeSignals } from '../_shared/diamonds/engine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const LIMIT = 5;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EVM_RE = /^0x[a-fA-F0-9]{40}$/;

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function getIp(req: Request) {
  const h = req.headers;
  return h.get('cf-connecting-ip') || h.get('x-real-ip') || (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
}

async function fetchMoralisBundle(address: string): Promise<MoralisRawBundle> {
  const apiKey = Deno.env.get('MORALIS_API_KEY');
  const bundle: MoralisRawBundle = {};
  if (!apiKey) return bundle;
  const eps: Array<[keyof MoralisRawBundle, string]> = [
    ['portfolio', `https://solana-gateway.moralis.io/account/mainnet/${address}/portfolio`],
    ['swaps', `https://solana-gateway.moralis.io/account/mainnet/${address}/swaps`],
    ['tokens', `https://solana-gateway.moralis.io/account/mainnet/${address}/tokens`],
    ['nfts', `https://solana-gateway.moralis.io/account/mainnet/${address}/nft`],
  ];
  await Promise.all(eps.map(async ([f, url]) => {
    try {
      const r = await fetch(url, { headers: { 'X-API-Key': apiKey, Accept: 'application/json' } });
      if (r.ok) bundle[f] = await r.json();
    } catch (_) { /* fail soft */ }
  }));
  return bundle;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const address = String(body?.address ?? '').trim();
    const peek = body?.peek === true;
    const chain = EVM_RE.test(address) ? 'evm' : SOL_RE.test(address) ? 'solana' : null;

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const ipHash = await sha256(getIp(req) + '|rei-diamond-salt');
    const { data: usage } = await supabase
      .from('ask_public_usage').select('last_asked_at, ask_count').eq('ip_hash', ipHash).maybeSingle();
    const windowStart = usage ? new Date(usage.last_asked_at).getTime() : 0;
    const active = usage && Date.now() - windowStart < WEEK_MS;
    const used = active ? usage!.ask_count : 0;

    if (peek) return json({ remaining: Math.max(0, LIMIT - used), limit: LIMIT });
    if (!chain) return json({ error: 'invalid_address', message: 'Paste a valid Solana or EVM (0x…) address.' }, 400);
    if (used >= LIMIT) {
      return json({ error: 'rate_limited', remaining: 0, message: 'You have used all 5 free scans this week.' }, 429);
    }

    const providers = chain === 'solana'
      ? await Promise.all([
          fetchMoralisBundle(address).then(normalizeMoralis),
          fetchHeliusSignals(address),
          fetchBirdeyeSignals(address),
        ])
      : await Promise.all([fetchAlchemySignals(address), fetchBlockscoutSignals(address)]);
    const merged = mergeSignals(providers);
    const profile = computeDiamonds(providers, merged);

    await supabase.from('ask_public_usage').upsert({
      ip_hash: ipHash,
      last_asked_at: active ? usage!.last_asked_at : new Date().toISOString(),
      ask_count: used + 1,
    }, { onConflict: 'ip_hash' });

    const { provider: _p, ok: _o, ...signals } = merged as any;
    return json({ address, chain, profile, signals, remaining: LIMIT - used - 1, limit: LIMIT });
  } catch (e) {
    console.error('[diamond-scan]', (e as Error).message);
    return json({ error: 'scan_failed', message: 'Scan failed — try again shortly.' }, 500);
  }
});
