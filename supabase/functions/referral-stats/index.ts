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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
    const wallets = new Set<string>();
    if (walletAddress) wallets.add(walletAddress);
    for (const r of codeRows || []) if (r.wallet_address) wallets.add(r.wallet_address);

    // Month window (UTC calendar month) — the same window the monthly pot uses.
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    let allTimeReferrals = 0;
    let referralsThisMonth = 0;
    let allTimeConversions = 0;
    let conversionsThisMonth = 0;
    let clicksThisMonth = 0;
    let allTimeClicks = 0;

    if (codes.length > 0) {
      const { data: conversions, error: convErr } = await supabase
        .from("referral_conversions")
        .select("conversion_type, created_at")
        .in("referral_code", codes);
      if (convErr) throw convErr;

      for (const c of conversions || []) {
        allTimeConversions++;
        const inMonth = c.created_at >= monthStart;
        if (inMonth) conversionsThisMonth++;
        if (c.conversion_type === "registration") {
          allTimeReferrals++;
          if (inMonth) referralsThisMonth++;
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

    // Points this month resets naturally: it is the sum of this month's ledger rows.
    let pointsThisMonth = 0;
    let pointsAllTime = 0;
    if (wallets.size > 0) {
      const walletList = Array.from(wallets);
      const { data: txs, error: txErr } = await supabase
        .from("points_transactions")
        .select("points, created_at")
        .in("wallet_address", walletList);
      if (txErr) throw txErr;
      for (const t of txs || []) {
        const pts = t.points || 0;
        pointsAllTime += pts;
        if (t.created_at && t.created_at >= monthStart) pointsThisMonth += pts;
      }
    }

    return json({
      monthStart,
      codes,
      allTimeReferrals,
      referralsThisMonth,
      pointsThisMonth,
      pointsAllTime,
      allTimeConversions,
      conversionsThisMonth,
      allTimeClicks,
      clicksThisMonth,
    });
  } catch (e) {
    console.error("referral-stats error:", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
