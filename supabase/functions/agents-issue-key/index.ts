// Issues an agent API key after verifying an x402 payment.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TIERS: Record<string, { amount: number; rate: number; days: number | null }> = {
  payg:    { amount: 5,  rate: 60,   days: null },
  starter: { amount: 25, rate: 300,  days: 30 },
  pro:     { amount: 99, rate: 1000, days: 30 },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `rei_live_${hex}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const tier = String(body.tier ?? "");
    const reference = String(body.payment_reference ?? "");
    const buyerWallet = String(body.buyer_wallet ?? "");
    const label = body.label ? String(body.label).slice(0, 60) : null;

    const tierConf = TIERS[tier];
    if (!tierConf) return json({ error: "Invalid tier" }, 400);
    if (!reference) return json({ error: "payment_reference required" }, 400);
    if (!buyerWallet) return json({ error: "buyer_wallet required" }, 400);

    // Verify payment
    const { data: payment, error: payErr } = await supabase
      .from("payment_references")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();
    if (payErr) throw payErr;
    if (!payment) return json({ error: "Payment not found" }, 404);
    if (payment.status !== "verified" && payment.status !== "completed") {
      return json({ error: `Payment not verified (status=${payment.status})` }, 400);
    }
    if (payment.payer !== buyerWallet) return json({ error: "Wallet mismatch" }, 403);
    if (Number(payment.amount) < tierConf.amount) {
      return json({ error: "Underpaid for this tier" }, 400);
    }

    // Ensure idempotency: don't double-issue for the same reference
    const { data: existing } = await supabase
      .from("agent_api_keys")
      .select("id")
      .eq("payment_reference", reference)
      .maybeSingle();
    if (existing) {
      return json({ error: "Key already issued for this payment" }, 409);
    }

    const rawKey = generateKey();
    const keyHash = await sha256Hex(rawKey);
    const keyPrefix = rawKey.slice(0, 14);
    const expiresAt = tierConf.days
      ? new Date(Date.now() + tierConf.days * 86400 * 1000).toISOString()
      : null;

    const { error: insErr } = await supabase.from("agent_api_keys").insert({
      key_hash: keyHash,
      key_prefix: keyPrefix,
      label,
      buyer_wallet: buyerWallet,
      tier,
      rate_limit_per_min: tierConf.rate,
      expires_at: expiresAt,
      payment_tx_signature: payment.tx_signature ?? "pending",
      payment_reference: reference,
    });
    if (insErr) throw insErr;

    return json({ key: rawKey, prefix: keyPrefix, tier, expires_at: expiresAt });
  } catch (e) {
    console.error("agents-issue-key error", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});
