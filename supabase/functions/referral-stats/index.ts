import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const walletAddress = typeof body?.walletAddress === "string" ? body.walletAddress.trim() : "";
    const xUserId = typeof body?.xUserId === "string" ? body.xUserId.trim() : "";

    if (!walletAddress && !xUserId) {
      return json({ error: "walletAddress or xUserId required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Backend configuration missing" }, 500);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Resolve every referral code owned by this user (wallet or X identity).
    const filters: string[] = [];
    if (walletAddress) filters.push(`wallet_address.eq.${walletAddress}`);
    if (xUserId) filters.push(`x_user_id.eq.${xUserId}`);

    const { data: codeRows, error: codeErr } = await supabase
      .from("referral_codes")
      .select("referral_code, wallet_address")
      .or(filters.join(","));
    if (codeErr) throw codeErr;

    const codes = (codeRows || []).map((r) => r.referral_code);

    // Month window (UTC calendar month) — the same window the monthly pot uses.
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    let allTimeConversions = 0;
    let conversionsThisMonth = 0;
    let clicksThisMonth = 0;
    let allTimeClicks = 0;
    let pointsThisMonth = 0;
    let pointsAllTime = 0;

    // Per-type conversion counts (registration | payment | booking), month + all time.
    const byType: Record<string, { allTime: number; month: number }> = {
      registration: { allTime: 0, month: 0 },
      payment: { allTime: 0, month: 0 },
      booking: { allTime: 0, month: 0 },
    };

    if (codes.length > 0) {
      const { data: conversions, error: convErr } = await supabase
        .from("referral_conversions")
        .select("conversion_type, points_awarded, created_at")
        .in("referral_code", codes);
      if (convErr) throw convErr;

      for (const c of conversions || []) {
        allTimeConversions++;
        const inMonth = c.created_at >= monthStart;
        const points = c.points_awarded || 0;
        pointsAllTime += points;
        if (inMonth) {
          conversionsThisMonth++;
          pointsThisMonth += points;
        }
        const bucket = byType[c.conversion_type];
        if (bucket) {
          bucket.allTime++;
          if (inMonth) bucket.month++;
        }
      }

      const { count: totalClicks } = await supabase
        .from("referral_clicks")
        .select("id", { count: "exact", head: true })
        .in("referral_code", codes);
      allTimeClicks = totalClicks ?? 0;

      const { count: monthClicks } = await supabase
        .from("referral_clicks")
        .select("id", { count: "exact", head: true })
        .in("referral_code", codes)
        .gte("clicked_at", monthStart);
      clicksThisMonth = monthClicks ?? 0;
    }

    return json({
      monthStart,
      codes,
      // "Referrals" = registration conversions (kept for existing consumers).
      allTimeReferrals: byType.registration.allTime,
      referralsThisMonth: byType.registration.month,
      pointsThisMonth,
      pointsAllTime,
      allTimeConversions,
      conversionsThisMonth,
      allTimeClicks,
      clicksThisMonth,
      registrationsAllTime: byType.registration.allTime,
      registrationsThisMonth: byType.registration.month,
      paymentsAllTime: byType.payment.allTime,
      paymentsThisMonth: byType.payment.month,
      bookingsAllTime: byType.booking.allTime,
      bookingsThisMonth: byType.booking.month,
    });
  } catch (e) {
    console.error("referral-stats error:", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
