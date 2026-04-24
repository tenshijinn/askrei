import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const body = await req.json().catch(() => ({}));
    const stripeSubscriptionId: string | undefined = body.stripeSubscriptionId;
    const customerEmail: string | undefined = body.customerEmail;
    const returnUrl: string = body.returnUrl || "https://askrei.lovable.app/unlimited-posts";
    const env: StripeEnv = body.environment === "live" ? "live" : "sandbox";

    if (!stripeSubscriptionId && !customerEmail) {
      return new Response(
        JSON.stringify({ error: "stripeSubscriptionId or customerEmail required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up customer id from our subscriptions table
    let stripeCustomerId: string | null = null;
    if (stripeSubscriptionId) {
      const { data } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("stripe_subscription_id", stripeSubscriptionId)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      stripeCustomerId = data?.stripe_customer_id ?? null;
    }

    if (!stripeCustomerId && customerEmail) {
      const { data } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("customer_email", customerEmail)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      stripeCustomerId = data?.stripe_customer_id ?? null;
    }

    if (!stripeCustomerId) {
      return new Response(
        JSON.stringify({ error: "No subscription found for this account" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = createStripeClient(env);
    const portal = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return new Response(JSON.stringify({ url: portal.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-portal-session error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
