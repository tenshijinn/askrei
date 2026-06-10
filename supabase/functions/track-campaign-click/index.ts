import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const POINTS_PER_UNIQUE_CLICK = 1;
const MAX_CLICKS_PER_IP_PER_HOUR = 30;

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
    const { shortCode, referrer } = await req.json();
    if (!shortCode || typeof shortCode !== "string") {
      return new Response(JSON.stringify({ error: "shortCode required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: campaign, error: campErr } = await supabase
      .from("campaign_subscriptions")
      .select("id, project_link, wallet_address, x_user_id, status, short_code, source")
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

    // Rate-limit: clicks from this IP across all campaigns in the last hour.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recent } = await supabase
      .from("campaign_clicks")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("clicked_at", oneHourAgo);

    const rateLimited = (recent || 0) >= MAX_CLICKS_PER_IP_PER_HOUR;

    // Dedupe: has this IP already hit this campaign today?
    let isUnique = false;
    let inserted = false;
    if (!rateLimited) {
      const { data: existing } = await supabase
        .from("campaign_clicks")
        .select("id")
        .eq("short_code", shortCode)
        .eq("ip_hash", ipHash)
        .eq("click_date", today)
        .maybeSingle();
      isUnique = !existing;

      const { error: insErr } = await supabase.from("campaign_clicks").insert({
        campaign_subscription_id: campaign.id,
        short_code: shortCode,
        ip_hash: ipHash,
        user_agent_hash: uaHash,
        referrer: referrer || null,
        session_id: crypto.randomUUID(),
        click_date: today,
        is_unique: isUnique,
        points_awarded: isUnique && !!campaign.wallet_address,
      });

      if (!insErr) {
        inserted = true;
      } else if (insErr.code !== "23505") {
        console.error("campaign_clicks insert failed:", insErr);
      } else {
        // Unique constraint hit — duplicate within window
        isUnique = false;
      }
    }

    // Award 1 point per unique click to promoter's wallet (if known).
    // Skip points for aggregated/platform-owned promotions — analytics still recorded.
    const isAggregated = typeof campaign.source === "string" && campaign.source.startsWith("aggregated:");
    if (inserted && isUnique && campaign.wallet_address && !isAggregated) {
      const { error: pointsErr } = await supabase.rpc("increment_user_points", {
        p_wallet_address: campaign.wallet_address,
        p_points: POINTS_PER_UNIQUE_CLICK,
        p_x_user_id: campaign.x_user_id || null,
      });
      if (pointsErr) console.error("increment_user_points failed:", pointsErr);

      await supabase.from("points_transactions").insert({
        wallet_address: campaign.wallet_address,
        points: POINTS_PER_UNIQUE_CLICK,
        transaction_type: "promotion_click",
      });
    }


    return new Response(
      JSON.stringify({
        redirect: campaign.project_link || "/",
        unique: isUnique,
        rateLimited,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("track-campaign-click error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
