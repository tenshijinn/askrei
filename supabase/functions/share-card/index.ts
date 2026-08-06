import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'earn-share-cards';
const SITE = 'https://rei.chat';


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
  // Legacy share links: send visitors to the clean on-domain share page.
  return new Response(null, {
    status: 302,
    headers: { Location: `${SITE}/s/${id}`, 'Cache-Control': 'public, max-age=300' },
  });
});

