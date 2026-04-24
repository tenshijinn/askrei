import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, getWebhookSecret, type StripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const envParam = url.searchParams.get("env");
  const env: StripeEnv = envParam === "live" ? "live" : "sandbox";

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: any;
  try {
    const stripe = createStripeClient(env);
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, getWebhookSecret(env));
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : "unknown"}`, {
      status: 400,
    });
  }

  console.log(`[payments-webhook ${env}] event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await upsertSubscription(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await markSubscriptionCanceled(event.data.object, env);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object, env);
        break;
      case "invoice.payment_failed":
        console.log("Invoice payment failed:", event.data.object.id);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(`Handler error: ${err instanceof Error ? err.message : "unknown"}`, {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const subscriptionId: string | null = session.subscription;
  const md = session.metadata || {};
  const product = md.product_id;

  if (!subscriptionId || product !== "unlimited_posts") {
    console.log("Not an unlimited_posts subscription checkout, skipping");
    return;
  }

  const customerEmail = session.customer_details?.email || session.customer_email || md.customer_email;
  if (!customerEmail) throw new Error("Missing customer email on checkout session");

  // Create campaign_subscriptions row from metadata
  const { error: csErr } = await supabase
    .from("campaign_subscriptions")
    .upsert(
      {
        stripe_subscription_id: subscriptionId,
        customer_email: customerEmail,
        project_name: md.project_name || "Unnamed Campaign",
        project_link: md.project_link || "",
        screenshot_url: md.screenshot_url || null,
        status: "active",
      },
      { onConflict: "stripe_subscription_id" }
    );
  if (csErr) console.error("Failed to upsert campaign_subscription:", csErr);

  // Trigger initial sync (fire-and-forget)
  try {
    await supabase.functions.invoke("sync-campaign-tasks", {
      body: { stripe_subscription_id: subscriptionId },
    });
  } catch (e) {
    console.error("Failed to invoke sync-campaign-tasks:", e);
  }
}

async function upsertSubscription(sub: any, env: StripeEnv) {
  const item = sub.items?.data?.[0];
  const md = sub.metadata || {};

  const periodStart = item?.current_period_start ?? sub.current_period_start;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;

  await supabase.from("subscriptions").upsert(
    {
      environment: env,
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer,
      customer_email: md.customer_email || null,
      price_id: item?.price?.lookup_key || null,
      product_id: typeof item?.price?.product === "string" ? item.price.product : null,
      status: sub.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end || false,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      metadata: md,
    },
    { onConflict: "stripe_subscription_id" }
  );

  // Update campaign_subscriptions expiry
  if (md.product_id === "unlimited_posts" && periodEnd) {
    await supabase
      .from("campaign_subscriptions")
      .update({
        expires_at: new Date(periodEnd * 1000).toISOString(),
        status: sub.status === "active" || sub.status === "trialing" ? "active" : sub.status,
      })
      .eq("stripe_subscription_id", sub.id);
  }
}

async function handleInvoicePaid(invoice: any, env: StripeEnv) {
  const subscriptionId: string | undefined = invoice.subscription;
  if (!subscriptionId) return;
  // The subscription.updated event will refresh period_end; nothing else to do.
  console.log(`Invoice paid for subscription ${subscriptionId}`);
}

async function markSubscriptionCanceled(sub: any, _env: StripeEnv) {
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.id);

  await supabase
    .from("campaign_subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", sub.id);
}
