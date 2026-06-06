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
    const { email, returnUrl, environment } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error("Valid email is required");
    }
    const env: StripeEnv = environment === "live" ? "live" : "sandbox";

    // 1. Try local DB first (fast path)
    let customerId: string | null = null;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .ilike("customer_email", normalizedEmail)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    customerId = sub?.stripe_customer_id ?? null;

    const stripe = createStripeClient(env);

    // 2. Fallback: look up directly in Stripe by email
    if (!customerId) {
      const list = await stripe.customers.list({ email: normalizedEmail, limit: 1 });
      customerId = list.data[0]?.id ?? null;
    }

    if (!customerId) {
      return new Response(
        JSON.stringify({ error: "No subscription found for that email." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || "https://askrei.lovable.app/unlimited-posts",
    });

    return new Response(JSON.stringify({ url: portal.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("lookup-customer-portal error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
