import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'rei-contributor-files';
const MAX_AUDIO = 25 * 1024 * 1024; // 25MB
const MAX_IMAGE = 10 * 1024 * 1024; // 10MB

function sanitize(s: string) {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const form = await req.formData();
    const file = form.get('file');
    const kind = String(form.get('kind') || '');

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'file required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let path: string;
    let signed = false;

    if (kind === 'rei-audio') {
      const xUserId = sanitize(String(form.get('x_user_id') || ''));
      if (!xUserId) {
        return new Response(JSON.stringify({ error: 'x_user_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (file.size > MAX_AUDIO) {
        return new Response(JSON.stringify({ error: 'file too large' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!/^(audio|video)\//.test(file.type)) {
        return new Response(JSON.stringify({ error: 'invalid file type' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const ext = (file.name.split('.').pop() || 'webm').replace(/[^a-z0-9]/gi, '').slice(0, 6) || 'webm';
      path = `${xUserId}/${Date.now()}_audio.${ext}`;
    } else if (kind === 'campaign-screenshot') {
      const ownerKey = sanitize(String(form.get('owner_key') || ''));
      if (!ownerKey) {
        return new Response(JSON.stringify({ error: 'owner_key required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (file.size > MAX_IMAGE) {
        return new Response(JSON.stringify({ error: 'file too large' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!/^image\//.test(file.type)) {
        return new Response(JSON.stringify({ error: 'invalid file type' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const ext = (file.name.split('.').pop() || 'png').replace(/[^a-z0-9]/gi, '').slice(0, 6) || 'png';
      path = `unlimited-posts/${ownerKey}/${Date.now()}.${ext}`;
      signed = true;
    } else {
      return new Response(JSON.stringify({ error: 'invalid kind' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;

    let signedUrl: string | null = null;
    if (signed) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (error) throw error;
      signedUrl = data.signedUrl;
    }

    return new Response(JSON.stringify({ success: true, path, signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('upload-contributor-file error:', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
