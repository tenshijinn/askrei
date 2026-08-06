import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'earn-share-cards';
const SITE = 'https://rei.chat';

function shortId() {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

function str(v: unknown, max = 60) {
  return typeof v === 'string' ? v.slice(0, max) : '';
}
function num(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const state = {
      assetSym: str(body.assetSym, 24),
      platform: str(body.platform, 40),
      amount: num(body.amount),
      frequency: str(body.frequency, 24),
      period: str(body.period, 12),
      invested: num(body.invested),
      finalVal: num(body.finalVal),
      windowLabel: str(body.windowLabel, 60),
    };
    if (!state.assetSym) {
      return new Response(JSON.stringify({ error: 'assetSym is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // optional PNG payload as a data URL
    let imagePath: string | null = null;
    const dataUrl = typeof body.image === 'string' ? body.image : '';
    const id = shortId();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (dataUrl.startsWith('data:image/png;base64,')) {
      const b64 = dataUrl.slice('data:image/png;base64,'.length);
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      if (bin.byteLength > 6_000_000) {
        return new Response(JSON.stringify({ error: 'Image too large' }), {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const path = `${id}.png`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, bin, { contentType: 'image/png', upsert: true });
      if (upErr) {
        console.error('upload failed', upErr.message);
      } else {
        imagePath = path;
      }
    }

    const { error } = await supabase
      .from('earn_shares')
      .insert({ id, state, image_path: imagePath });
    if (error) {
      console.error('insert failed', error.message);
      return new Response(JSON.stringify({ error: 'Could not save share' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ id, url: `${SITE}/functions/v1/share-card?id=${id}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('earn-share error', e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
