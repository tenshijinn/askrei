import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

/** Small allow-listed image proxy so the share card can be rasterised client-side
 *  (html-to-image needs CORS-enabled images). */
const ALLOWED_HOSTS = new Set([
  'assets.coingecko.com',
  'coin-images.coingecko.com',
  'www.coingecko.com',
  's2.coinmarketcap.com',
  'pbs.twimg.com',
  'raw.githubusercontent.com',
  'arweave.net',
  'ipfs.io',
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const raw = new URL(req.url).searchParams.get('u') ?? '';
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response('Invalid url', { status: 400, headers: corsHeaders });
  }
  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response('Host not allowed', { status: 403, headers: corsHeaders });
  }

  try {
    const upstream = await fetch(target.toString(), { headers: { Accept: 'image/*' } });
    if (!upstream.ok) {
      return new Response('Upstream error', { status: upstream.status, headers: corsHeaders });
    }
    const type = upstream.headers.get('Content-Type') ?? 'image/png';
    if (!type.startsWith('image/')) {
      return new Response('Not an image', { status: 415, headers: corsHeaders });
    }
    return new Response(await upstream.arrayBuffer(), {
      headers: {
        ...corsHeaders,
        'Content-Type': type,
        'Cache-Control': 'public, max-age=604800',
      },
    });
  } catch (e) {
    console.error('img-proxy error', e);
    return new Response('Fetch failed', { status: 502, headers: corsHeaders });
  }
});
