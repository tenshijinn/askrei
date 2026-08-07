import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'share-cards';
const SITE = 'https://rei.chat';
const TEN_YEARS = 315_360_000;
const MAX_BYTES = 6_000_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function shortId() {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

function str(v: unknown, max: number) {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

function page(title: string, desc: string, image: string, redirectUrl: string) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@AskRei_">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1600">
<meta property="og:image:height" content="900">
<meta property="og:url" content="${esc(redirectUrl)}">
<title>${esc(title)}</title>
<script>location.replace(${JSON.stringify(redirectUrl)})</script>
</head><body><p>Redirecting to <a href="${esc(redirectUrl)}">${esc(redirectUrl)}</a></p></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method === 'GET') return new Response('<!doctype html><html><head><meta name="twitter:card" content="summary_large_image"></head><body>hi</body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return json({ error: 'Invalid body' }, 400);

    const pngBase64 = typeof body.pngBase64 === 'string' ? body.pngBase64 : '';
    const title = str(body.tweetTitle, 120) || 'Bounty Earning Calculator · Rei';
    const desc = str(body.ogDescription, 200) || title;
    let redirectUrl = str(body.redirectUrl, 300);
    // only allow redirects back to our own site
    if (!redirectUrl.startsWith(`${SITE}/`)) redirectUrl = `${SITE}/earn`;

    const b64 = pngBase64.replace(/^data:image\/png;base64,/, '');
    if (!b64) return json({ error: 'pngBase64 is required' }, 400);

    let bin: Uint8Array;
    try {
      bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    } catch {
      return json({ error: 'Invalid image payload' }, 400);
    }
    if (bin.byteLength > MAX_BYTES) return json({ error: 'Image too large' }, 413);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const id = shortId();

    const upImg = await supabase.storage
      .from(BUCKET)
      .upload(`${id}.png`, bin, { contentType: 'image/png', upsert: false });
    if (upImg.error) {
      console.error('png upload failed', upImg.error.message);
      return json({ error: 'Could not store image' }, 500);
    }

    const signedImg = await supabase.storage.from(BUCKET).createSignedUrl(`${id}.png`, TEN_YEARS);
    if (signedImg.error || !signedImg.data?.signedUrl) {
      console.error('png sign failed', signedImg.error?.message);
      return json({ error: 'Could not sign image' }, 500);
    }
    const imageUrl = signedImg.data.signedUrl;

    const upPage = await supabase.storage
      .from(BUCKET)
      .upload(`${id}.html`, new Blob([page(title, desc, imageUrl, redirectUrl)], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: false,
      });
    if (upPage.error) {
      console.error('html upload failed', upPage.error.message);
      return json({ error: 'Could not store share page' }, 500);
    }

    const signedPage = await supabase.storage.from(BUCKET).createSignedUrl(`${id}.html`, TEN_YEARS);
    if (signedPage.error || !signedPage.data?.signedUrl) {
      console.error('html sign failed', signedPage.error?.message);
      return json({ error: 'Could not sign share page' }, 500);
    }

    return json({ id, pageUrl: signedPage.data.signedUrl, imageUrl });
  } catch (e) {
    console.error('create-share error', e);
    return json({ error: 'Unexpected error' }, 500);
  }
});
