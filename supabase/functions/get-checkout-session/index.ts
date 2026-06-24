import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { sessionId, environment } = await req.json();
    if (!sessionId || typeof sessionId !== "string") throw new Error("sessionId required");
    const env: StripeEnv = environment === "live" ? "live" : "sandbox";

    const stripe = createStripeClient(env);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

    // Look up the campaign row server-side so the client doesn't need to read
    // sensitive columns directly from campaign_subscriptions.
    let campaign: Record<string, unknown> | null = null;
    if (subscriptionId) {
      const { data } = await supabase
        .from("campaign_subscriptions")
        .select(
          "id, project_name, project_link, status, tasks_imported_count, scrape_count, last_scraped_at, expires_at"
        )
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();
      campaign = data ?? null;
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        subscriptionId,
        customerId: typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null,
        customerEmail: session.customer_details?.email || session.customer_email || null,
        paymentStatus: session.payment_status,
        status: session.status,
        campaign,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("get-checkout-session error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
