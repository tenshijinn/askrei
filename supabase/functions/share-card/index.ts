import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'earn-share-cards';
const SITE = 'https://rei.chat';
const FN_BASE = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmt = (n: number) =>
  n >= 1000 ? Math.round(n).toLocaleString('en-US') : n.toFixed(n % 1 === 0 ? 0 : 2);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const id = (url.searchParams.get('id') ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  const wantsImage = url.pathname.endsWith('/image');

  if (!id) {
    return new Response('Missing id', { status: 400, headers: { 'Content-Type': 'text/plain' } });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: row, error } = await supabase
    .from('earn_shares')
    .select('id, state, image_path')
    .eq('id', id)
    .maybeSingle();

  if (error) console.error('lookup failed', error.message);
  if (!row) {
    return new Response('Share not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  if (wantsImage) {
    if (!row.image_path) return new Response('No image', { status: 404 });
    const { data: file, error: dlErr } = await supabase.storage.from(BUCKET).download(row.image_path);
    if (dlErr || !file) {
      console.error('image download failed', dlErr?.message);
      return new Response('No image', { status: 404 });
    }
    return new Response(await file.arrayBuffer(), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  if (url.searchParams.get('json') === '1') {
    return new Response(JSON.stringify({ id: row.id, state: row.state }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }



  const s = (row.state ?? {}) as Record<string, unknown>;
  const assetSym = String(s.assetSym ?? '');
  const platform = String(s.platform ?? '');
  const invested = Number(s.invested ?? 0);
  const finalVal = Number(s.finalVal ?? 0);
  const windowLabel = String(s.windowLabel ?? '');
  const pct = invested > 0 ? ((finalVal - invested) / invested) * 100 : 0;

  const title = platform
    ? `$${assetSym} on ${platform}: ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}% on bounty earnings`
    : `$${assetSym}: ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}% on bounty earnings`;
  const description = `$${fmt(invested)} of bounties staked grew to $${fmt(finalVal)} — ${windowLabel}. Run your own backtest on Rei's Bounty Earning Calculator.`;
  const pageUrl = `${FN_BASE}/share-card?id=${id}`;
  const imageUrl = row.image_path ? `${FN_BASE}/share-card/image?id=${id}` : '';
  const appUrl = `${SITE}/earn?share=${id}`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(pageUrl)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Rei AI" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(pageUrl)}" />
${imageUrl ? `<meta property="og:image" content="${esc(imageUrl)}" />
<meta property="og:image:width" content="1600" />
<meta property="og:image:height" content="900" />` : ''}
<meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
${imageUrl ? `<meta name="twitter:image" content="${esc(imageUrl)}" />` : ''}
<meta http-equiv="refresh" content="0; url=${esc(appUrl)}" />
<style>body{margin:0;background:#0b0a09;color:#f1e8dd;font-family:ui-monospace,Menlo,Consolas,monospace;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px}a{color:#e9c8ba}</style>
</head>
<body>
<main>
<h1 style="font-size:18px;font-weight:500">${esc(title)}</h1>
<p style="color:#8f8579;font-size:14px;max-width:520px">${esc(description)}</p>
<p><a href="${esc(appUrl)}">Open the Bounty Earning Calculator →</a></p>
</main>
<script>location.replace(${JSON.stringify(appUrl)});</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
});
