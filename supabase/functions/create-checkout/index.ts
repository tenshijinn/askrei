import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface Body {
  priceId: string;
  customerEmail?: string;
  returnUrl: string;
  environment: StripeEnv;
  metadata?: Record<string, string>;
}

// Resolve (or create) a stable Stripe Customer by email so repeat checkouts
// from the same email reuse the same Customer object — critical for portal
// lookups and managed-payments history.
async function resolveOrCreateCustomerByEmail(
  stripe: ReturnType<typeof createStripeClient>,
  email: string
): Promise<string> {
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length) return existing.data[0].id;
  const created = await stripe.customers.create({ email });
  return created.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Body;

    if (!body.priceId || !/^[a-zA-Z0-9_-]+$/.test(body.priceId)) {
      throw new Error("Invalid priceId");
    }
    if (!body.returnUrl) throw new Error("returnUrl is required");
    if (body.environment !== "sandbox" && body.environment !== "live") {
      throw new Error("Invalid environment");
    }

    const stripe = createStripeClient(body.environment);

    const prices = await stripe.prices.list({ lookup_keys: [body.priceId] });
    if (!prices.data.length) throw new Error(`Price not found: ${body.priceId}`);
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const productId = body.metadata?.product_id;
    const email = body.customerEmail?.trim().toLowerCase();

    // Duplicate-subscription guard: if this email already has an active sub
    // for the same product, block and surface a special error so the UI can
    // redirect them to the billing portal instead of starting a 2nd sub.
    if (isRecurring && email && productId) {
      const { data: existing } = await supabase
        .from("campaign_subscriptions")
        .select("stripe_subscription_id, status")
        .ilike("customer_email", email)
        .in("status", ["active", "trialing", "past_due"])
        .limit(1)
        .maybeSingle();
      if (existing?.stripe_subscription_id) {
        return new Response(
          JSON.stringify({
            error: "already_subscribed",
            message: "This email already has an active subscription. Manage it in the customer portal.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Reuse Stripe Customer across repeat checkouts from the same email.
    const customerId = email
      ? await resolveOrCreateCustomerByEmail(stripe, email)
      : undefined;

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded",
      return_url: body.returnUrl,
      managed_payments: { enabled: true },
      ...(customerId ? { customer: customerId } : (email && { customer_email: email })),
      ...(body.metadata && {
        metadata: body.metadata,
        ...(isRecurring && { subscription_data: { metadata: body.metadata } }),
      }),
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-checkout error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
