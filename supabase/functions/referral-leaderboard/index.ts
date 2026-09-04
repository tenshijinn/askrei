// Monthly referral leaderboard.
//   POST { month?: "YYYY-MM", walletAddress?, xUserId? }
// Returns the live top 10 for the current UTC month, or a closed month's
// snapshot when `month` is a past month. Identities are masked for the public;
// full wallets/handles are only returned to admins (validated JWT + has_role).

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

const maskWallet = (w?: string | null) =>
  w ? `${w.slice(0, 4)}…${w.slice(-4)}` : "—";

const monthKey = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

interface Row {
  rank: number;
  wallet_address: string;
  x_user_id: string | null;
  x_handle: string | null;
  referral_code: string | null;
  points: number;
  conversions: number;
  pot_share_pct: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const monthParam = typeof body?.month === "string" ? body.month.trim() : "";
    const wallet = typeof body?.walletAddress === "string" ? body.walletAddress.trim() : "";
    const xUserId = typeof body?.xUserId === "string" ? body.xUserId.trim() : "";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Admin? Only then do we expose full wallets and DM targets.
    let isAdmin = false;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (token) {
      const { data: userRes } = await supabase.auth.getUser(token);
      const uid = userRes?.user?.id;
      if (uid) {
        const { data: admin } = await supabase.rpc("has_role", {
          _user_id: uid,
          _role: "admin",
        });
        isAdmin = admin === true;
      }
    }

    const now = new Date();
    const currentKey = monthKey(now);
    const requestedKey = /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : currentKey;
    const isCurrent = requestedKey === currentKey;
    const monthDate = `${requestedKey}-01`;

    let rows: Row[] = [];
    let live = isCurrent;

    if (!isCurrent) {
      const { data: snap, error } = await supabase
        .from("referral_leaderboard_snapshots")
        .select("rank, wallet_address, x_user_id, x_handle, referral_code, points, conversions, pot_share_pct")
        .eq("period_month", monthDate)
        .order("rank", { ascending: true });
      if (error) throw error;
      rows = (snap || []) as Row[];
    }

    // Current month, or a past month with no snapshot yet → compute live.
    if (isCurrent || rows.length === 0) {
      const { data: computed, error } = await supabase.rpc("referral_leaderboard", {
        p_month: monthDate,
      });
      if (error) throw error;
      rows = (computed || []) as Row[];
      live = true;
    }

    // Which past months have a locked-in snapshot (for the month selector)?
    const { data: months } = await supabase
      .from("referral_leaderboard_snapshots")
      .select("period_month")
      .order("period_month", { ascending: false });
    const availableMonths = Array.from(
      new Set((months || []).map((m: { period_month: string }) => m.period_month.slice(0, 7))),
    );

    const viewerRow = rows.find(
      (r) =>
        (wallet && r.wallet_address === wallet) ||
        (xUserId && r.x_user_id === xUserId),
    );

    const top = rows.slice(0, 10).map((r) => ({
      rank: r.rank,
      handle: r.x_handle || null,
      walletMasked: maskWallet(r.wallet_address),
      points: Number(r.points) || 0,
      conversions: Number(r.conversions) || 0,
      potSharePct: Number(r.pot_share_pct) || 0,
      isViewer:
        (!!wallet && r.wallet_address === wallet) ||
        (!!xUserId && r.x_user_id === xUserId),
      // Admin-only fields for the winner confirmation panel.
      ...(isAdmin
        ? {
            wallet: r.wallet_address,
            xUserId: r.x_user_id,
            referralCode: r.referral_code,
          }
        : {}),
    }));

    return json({
      month: requestedKey,
      live,
      isAdmin,
      availableMonths,
      rows: top,
      totalRanked: rows.length,
      viewerRank: viewerRow
        ? {
            rank: viewerRow.rank,
            points: Number(viewerRow.points) || 0,
            potSharePct: Number(viewerRow.pot_share_pct) || 0,
          }
        : null,
    });
  } catch (e) {
    console.error("referral-leaderboard error:", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
