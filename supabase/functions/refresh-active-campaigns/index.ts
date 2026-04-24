import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const now = new Date().toISOString();
    const { data: active, error } = await supabase
      .from("campaign_subscriptions")
      .select("id")
      .eq("status", "active")
      .gt("expires_at", now);

    if (error) throw error;

    let invoked = 0;
    const errors: string[] = [];
    for (const sub of active || []) {
      try {
        await supabase.functions.invoke("sync-campaign-tasks", {
          body: { campaign_subscription_id: sub.id },
        });
        invoked++;
      } catch (e) {
        errors.push(`${sub.id}: ${e instanceof Error ? e.message : "fail"}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: active?.length || 0, invoked, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("refresh error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
