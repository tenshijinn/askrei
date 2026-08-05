import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE_RE = /^[a-z0-9_-]{4,32}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Public unique-visit counter for a single short code
    if (typeof body.shortCode === "string") {
      if (!CODE_RE.test(body.shortCode)) return json({ error: "invalid shortCode" }, 400);
      const { data, error } = await supabase.rpc("get_campaign_unique_visits", {
        p_short_code: body.shortCode,
      });
      if (error) throw error;
      return json({ uniqueVisits: Number(data) || 0 });
    }

    // Aggregated click/impression stats for a set of campaigns
    const ids = Array.isArray(body.campaignIds) ? body.campaignIds : null;
    if (!ids || ids.length === 0) return json({ error: "campaignIds required" }, 400);
    if (ids.length > 100) return json({ error: "too many campaignIds" }, 400);
    if (!ids.every((id: unknown) => typeof id === "string" && UUID_RE.test(id))) {
      return json({ error: "invalid campaignIds" }, 400);
    }

    const [clicks, impressions] = await Promise.all([
      supabase.rpc("get_campaign_click_stats", { p_campaign_ids: ids }),
      supabase.rpc("get_campaign_impression_stats", { p_campaign_ids: ids }),
    ]);

    if (clicks.error) throw clicks.error;

    return json({
      clicks: clicks.data ?? [],
      impressions: impressions.error ? [] : impressions.data ?? [],
    });
  } catch (e) {
    console.error("campaign-stats error:", e);
    return json({ error: "Failed to load campaign stats" }, 500);
  }
});
