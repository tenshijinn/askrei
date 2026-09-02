import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ConversionType = "registration" | "payment" | "booking";

const POINTS: Record<ConversionType, number> = {
  registration: 25,
  payment: 100,
  booking: 10,
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const conversionType = body?.conversionType as ConversionType;
    const referralCode = typeof body?.referralCode === "string" ? body.referralCode.trim() : "";
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
    const convertedWallet =
      typeof body?.convertedWallet === "string" ? body.convertedWallet.trim() : "";
    const paymentAmountRaw = body?.paymentAmount;
    const dedupeKeyRaw = typeof body?.dedupeKey === "string" ? body.dedupeKey.trim() : "";

    if (!conversionType || !["registration", "payment", "booking"].includes(conversionType)) {
      return json({ error: "conversionType must be registration, payment or booking" }, 400);
    }
    if (!referralCode || referralCode.length > 32) {
      return json({ error: "referralCode required" }, 400);
    }
    if (conversionType !== "booking" && !convertedWallet) {
      return json({ error: "convertedWallet required" }, 400);
    }

    const paymentAmount =
      typeof paymentAmountRaw === "number" && isFinite(paymentAmountRaw) && paymentAmountRaw > 0
        ? paymentAmountRaw
        : null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // The promoter identity comes from the referral registry, never from the caller.
    const { data: code } = await supabase
      .from("referral_codes")
      .select("referral_code, wallet_address, x_user_id, is_active")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (!code) return json({ recorded: false, reason: "unknown_referral_code" }, 200);
    if (!code.is_active) return json({ recorded: false, reason: "inactive_referral_code" }, 200);

    // Self-referral guard: a promoter cannot convert through their own link.
    const wallet = convertedWallet || `guest:${sessionId || crypto.randomUUID()}`;
    if (convertedWallet && convertedWallet === code.wallet_address) {
      return json({ recorded: false, reason: "self_referral" }, 200);
    }

    // Link back to the originating click when we can find it.
    let clickId: string | null = null;
    if (sessionId) {
      const { data: click } = await supabase
        .from("referral_clicks")
        .select("id")
        .eq("referral_code", referralCode)
        .eq("session_id", sessionId)
        .maybeSingle();
      if (click) clickId = click.id;
    }
    if (!clickId) {
      const { data: click } = await supabase
        .from("referral_clicks")
        .select("id")
        .eq("referral_code", referralCode)
        .order("clicked_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (click) clickId = click.id;
    }

    const points = POINTS[conversionType];
    const dedupeKey =
      dedupeKeyRaw || `${conversionType}:${referralCode}:${wallet}`;

    const { data: inserted, error: insErr } = await supabase
      .from("referral_conversions")
      .insert({
        referral_code: referralCode,
        conversion_type: conversionType,
        converted_wallet: wallet,
        payment_amount: paymentAmount,
        points_awarded: points,
        click_id: clickId,
        dedupe_key: dedupeKey,
      })
      .select("id")
      .maybeSingle();

    if (insErr) {
      if (insErr.code === "23505") {
        return json({ recorded: false, reason: "duplicate", dedupeKey }, 200);
      }
      console.error("referral_conversions insert failed:", insErr);
      return json({ error: "Failed to record conversion" }, 500);
    }

    // Award promoter points once, alongside the newly recorded conversion.
    const { error: pointsErr } = await supabase.rpc("increment_user_points", {
      p_wallet_address: code.wallet_address,
      p_points: points,
      p_x_user_id: code.x_user_id || null,
    });
    if (pointsErr) console.error("increment_user_points failed:", pointsErr);

    await supabase.from("points_transactions").insert({
      wallet_address: code.wallet_address,
      points,
      transaction_type: `referral_${conversionType}`,
    });

    return json({
      recorded: true,
      conversionId: inserted?.id ?? null,
      conversionType,
      pointsAwarded: points,
      clickId,
    });
  } catch (e) {
    console.error("track-referral-conversion error:", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
