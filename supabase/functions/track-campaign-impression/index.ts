import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_IMPRESSIONS_PER_IP_PER_HOUR = 200;

async function hashString(str: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.slice(0, 10) ?? "";
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(str + salt));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { shortCode, guest } = await req.json();
    if (!shortCode || typeof shortCode !== "string") {
      return new Response(JSON.stringify({ error: "shortCode required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isGuest = guest === true;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: campaign, error: campErr } = await supabase
      .from("campaign_subscriptions")
      .select("id, short_code")
      .eq("short_code", shortCode)
      .maybeSingle();

    if (campErr || !campaign) {
      return new Response(JSON.stringify({ error: "Unknown campaign" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const ipHash = await hashString(ip);
    const uaHash = await hashString(ua);
    const today = new Date().toISOString().slice(0, 10);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recent } = await supabase
      .from("campaign_impressions")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("viewed_at", oneHourAgo);

    if ((recent || 0) >= MAX_IMPRESSIONS_PER_IP_PER_HOUR) {
      return new Response(JSON.stringify({ ok: true, rateLimited: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existing } = await supabase
      .from("campaign_impressions")
      .select("id")
      .eq("short_code", shortCode)
      .eq("ip_hash", ipHash)
      .eq("impression_date", today)
      .maybeSingle();

    const isUnique = !existing;

    const { error: insErr } = await supabase.from("campaign_impressions").insert({
      campaign_subscription_id: campaign.id,
      short_code: shortCode,
      ip_hash: ipHash,
      user_agent_hash: uaHash,
      session_id: crypto.randomUUID(),
      impression_date: today,
      is_unique: isUnique,
      is_guest: isGuest,
    });

    if (insErr) console.error("campaign_impressions insert failed:", insErr);

    return new Response(JSON.stringify({ ok: true, unique: isUnique }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("track-campaign-impression error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
