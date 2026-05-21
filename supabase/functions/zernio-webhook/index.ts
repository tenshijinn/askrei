// Zernio -> Rei webhook receiver.
// Accepts X.com event payloads forwarded from Zernio, authenticates via
// shared secret (header OR query param), and persists each event into
// public.zernio_webhook_events for downstream processing by Hermes/Rei.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-zernio-signature, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const WEBHOOK_SECRET = Deno.env.get("ZERNIO_WEBHOOK_SECRET");

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function pickString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Simple health check
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, service: "zernio-webhook" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!WEBHOOK_SECRET) {
    console.error("[zernio-webhook] ZERNIO_WEBHOOK_SECRET is not configured");
    return new Response(
      JSON.stringify({ error: "Server misconfigured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Auth: accept secret via header or ?secret= query param
  const url = new URL(req.url);
  const providedSecret =
    req.headers.get("x-webhook-secret") ??
    req.headers.get("x-zernio-signature") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret") ??
    "";

  if (!timingSafeEqual(providedSecret, WEBHOOK_SECRET)) {
    console.warn("[zernio-webhook] Invalid secret");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse JSON payload
  let payload: any;
  try {
    payload = await req.json();
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!payload || typeof payload !== "object") {
    return new Response(JSON.stringify({ error: "Payload must be an object" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Normalize common fields from a variety of likely shapes
  const data = payload.data ?? payload.event ?? payload;
  const user = data?.user ?? data?.author ?? payload?.user ?? {};

  const event_type = pickString(
    payload.event_type,
    payload.type,
    data?.event_type,
    data?.type,
  );
  const external_id = pickString(
    payload.id,
    data?.id,
    data?.tweet_id,
    data?.post_id,
  );
  const x_user_id = pickString(
    user?.id_str,
    user?.id,
    data?.user_id,
    payload?.x_user_id,
  );
  const x_handle = pickString(
    user?.screen_name,
    user?.username,
    user?.handle,
    data?.handle,
    payload?.handle,
  );

  // Support batched payloads: { events: [...] }
  const events = Array.isArray(payload.events) ? payload.events : null;

  try {
    if (events && events.length > 0) {
      const rows = events.map((ev: any) => {
        const evData = ev?.data ?? ev;
        const evUser = evData?.user ?? evData?.author ?? {};
        return {
          source: "zernio",
          event_type: pickString(ev?.event_type, ev?.type, evData?.type),
          external_id: pickString(
            ev?.id,
            evData?.id,
            evData?.tweet_id,
            evData?.post_id,
          ),
          x_user_id: pickString(evUser?.id_str, evUser?.id, evData?.user_id),
          x_handle: pickString(
            evUser?.screen_name,
            evUser?.username,
            evUser?.handle,
          ),
          payload: ev,
        };
      });

      const { data: inserted, error } = await supabase
        .from("zernio_webhook_events")
        .insert(rows)
        .select("id");

      if (error) throw error;

      console.log(`[zernio-webhook] Stored ${inserted?.length ?? 0} batched events`);
      return new Response(
        JSON.stringify({ received: true, count: inserted?.length ?? 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: inserted, error } = await supabase
      .from("zernio_webhook_events")
      .insert({
        source: "zernio",
        event_type,
        external_id,
        x_user_id,
        x_handle,
        payload,
      })
      .select("id")
      .single();

    if (error) throw error;

    console.log(
      `[zernio-webhook] Stored event ${inserted.id} (type=${event_type ?? "unknown"}, handle=${x_handle ?? "unknown"})`,
    );

    return new Response(
      JSON.stringify({ received: true, id: inserted.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[zernio-webhook] Insert failed:", msg);
    return new Response(
      JSON.stringify({ error: "Failed to store event", detail: msg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
