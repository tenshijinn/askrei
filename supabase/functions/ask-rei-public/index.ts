// Public /ask endpoint: anonymous 1 free ask per week per IP.
// Uses AI to pick the single best matching bounty for the user's query.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    (h.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    "unknown"
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return json({ error: "Missing query" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const ip = getIp(req);
    const ipHash = await sha256(ip + "|rei-ask-salt");

    // Rate limit check
    const { data: existing } = await supabase
      .from("ask_public_usage")
      .select("id, last_asked_at, ask_count")
      .eq("ip_hash", ipHash)
      .maybeSingle();

    if (existing) {
      const last = new Date(existing.last_asked_at).getTime();
      if (Date.now() - last < WEEK_MS) {
        return json({ error: "rate_limited", message: "Sign up to keep chatting with Rei." }, 429);
      }
    }

    // Fetch a candidate pool of active bounties
    const { data: tasks } = await supabase
      .from("v_public_tasks")
      .select("id, title, description, company_name, compensation, link, role_tags, opportunity_type, og_image, tracking_short_code, created_at")
      .order("created_at", { ascending: false })
      .limit(60);

    const pool = tasks ?? [];
    let chosen = pool[0] ?? null;
    let reply = "";

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (apiKey && pool.length) {
      const compact = pool.map((t, i) => ({
        i,
        title: t.title,
        company: t.company_name,
        comp: t.compensation,
        tags: t.role_tags,
        type: t.opportunity_type,
        desc: (t.description ?? "").slice(0, 220),
      }));
      const prompt = `You are Rei, a Web3 opportunity assistant. From the JSON list of bounties, pick the SINGLE best match for the user's question. Reply in strict JSON: {"index": <number>, "reply": "<one short friendly sentence explaining the pick>"}. If nothing fits, still pick the closest.\n\nUser question: ${query}\n\nBounties: ${JSON.stringify(compact)}`;

      try {
        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });
        if (r.ok) {
          const j = await r.json();
          const content = j?.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(content);
          if (typeof parsed.index === "number" && pool[parsed.index]) {
            chosen = pool[parsed.index];
          }
          if (typeof parsed.reply === "string") reply = parsed.reply;
        }
      } catch (_) { /* fall through */ }
    }

    if (!reply) reply = chosen ? `Here's a bounty that matches "${query}".` : "I couldn't find a matching bounty right now.";

    // Record usage (upsert)
    await supabase.from("ask_public_usage").upsert({
      ip_hash: ipHash,
      last_asked_at: new Date().toISOString(),
      ask_count: (existing?.ask_count ?? 0) + 1,
    }, { onConflict: "ip_hash" });

    return json({ reply, bounty: chosen });
  } catch (e) {
    console.error("ask-rei-public error:", e);
    return json({ error: "server_error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
