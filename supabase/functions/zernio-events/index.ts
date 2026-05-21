// Zernio events fetch API for Hermes/Rei agent.
//
// GET  /functions/v1/zernio-events
//   Query params:
//     since        ISO timestamp - return events with received_at > since
//     limit        max rows (default 100, max 500)
//     event_type   filter exact match (e.g. comment.received)
//     unprocessed  "true" to only return processed = false rows
//   Returns: { events: [...], next_since: ISO, count: N }
//
// POST /functions/v1/zernio-events/ack
//   Body: { ids: string[], error?: string }
//   Marks rows processed = true (or sets processing_error if error provided).
//
// Auth (both): shared ZERNIO_WEBHOOK_SECRET via
//   x-webhook-secret header, Authorization: Bearer <secret>, or ?secret= query.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-zernio-signature, x-webhook-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function checkAuth(req: Request, url: URL): Response | null {
  if (!WEBHOOK_SECRET) {
    console.error("[zernio-events] ZERNIO_WEBHOOK_SECRET is not configured");
    return json({ error: "Server misconfigured" }, 500);
  }
  const provided =
    req.headers.get("x-webhook-secret") ??
    req.headers.get("x-zernio-signature") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret") ??
    "";
  if (!timingSafeEqual(provided, WEBHOOK_SECRET)) {
    return json({ error: "Unauthorized" }, 401);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "");
  const isAck = path.endsWith("/ack");

  const authErr = checkAuth(req, url);
  if (authErr) return authErr;

  // -------- POST /ack --------
  if (req.method === "POST" && isAck) {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const ids = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : [];
    if (ids.length === 0) {
      return json({ error: "ids must be a non-empty string array" }, 400);
    }
    const errorMsg = typeof body?.error === "string" ? body.error : null;
    const patch: Record<string, unknown> = { processed: true };
    if (errorMsg) patch.processing_error = errorMsg;

    const { data, error } = await supabase
      .from("zernio_webhook_events")
      .update(patch)
      .in("id", ids)
      .select("id");

    if (error) {
      console.error("[zernio-events] ack failed:", error.message);
      return json({ error: "Failed to ack", detail: error.message }, 500);
    }
    return json({ acked: data?.length ?? 0, ids: data?.map((r) => r.id) ?? [] });
  }

  // -------- GET / --------
  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const since = url.searchParams.get("since");
  const eventType = url.searchParams.get("event_type");
  const unprocessed = url.searchParams.get("unprocessed") === "true";
  const limitParam = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const limit = Math.min(Math.max(isNaN(limitParam) ? 100 : limitParam, 1), 500);

  let q = supabase
    .from("zernio_webhook_events_normalized")
    .select(
      "id, source, event_type, event_external_id, received_at, processed, processing_error, author_handle, author_user_id, comment_text, in_reply_to_tweet_id, payload",
    )
    .order("received_at", { ascending: true })
    .limit(limit);

  if (since) q = q.gt("received_at", since);
  if (eventType) q = q.eq("event_type", eventType);
  if (unprocessed) q = q.eq("processed", false);

  const { data, error } = await q;
  if (error) {
    console.error("[zernio-events] query failed:", error.message);
    return json({ error: "Failed to fetch events", detail: error.message }, 500);
  }

  const events = data ?? [];
  const nextSince =
    events.length > 0
      ? events[events.length - 1].received_at
      : since ?? new Date().toISOString();

  return json({ events, count: events.length, next_since: nextSince });
});
