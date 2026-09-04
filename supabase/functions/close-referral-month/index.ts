// Locks in a month's referral leaderboard (top 10) so winners can be announced
// on X or DM'd. Runs from cron on the 1st of each month at 00:15 UTC, and is
// idempotent — re-running a month rewrites the same snapshot rows.
//
// Auth: x-internal-key header must match REI_AGENT_INTERNAL_KEY.
//   POST { month?: "YYYY-MM" }   (defaults to the previous UTC month)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const monthKey = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const started = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const internalKey = Deno.env.get("REI_AGENT_INTERNAL_KEY") ?? "";
    if (!internalKey || req.headers.get("x-internal-key") !== internalKey) {
      return json({ error: "unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date();
    const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const key = /^\d{4}-\d{2}$/.test(body?.month ?? "") ? body.month : monthKey(prev);
    const monthDate = `${key}-01`;

    const { data: computed, error: rpcErr } = await supabase.rpc("referral_leaderboard", {
      p_month: monthDate,
    });
    if (rpcErr) throw rpcErr;

    const top = (computed || []).slice(0, 10).map((r: Record<string, unknown>) => ({
      period_month: monthDate,
      rank: Number(r.rank),
      wallet_address: String(r.wallet_address),
      x_user_id: (r.x_user_id as string) ?? null,
      x_handle: (r.x_handle as string) ?? null,
      referral_code: (r.referral_code as string) ?? null,
      points: Number(r.points) || 0,
      conversions: Number(r.conversions) || 0,
      pot_share_pct: Number(r.pot_share_pct) || 0,
    }));

    // Replace any previous snapshot for this month, then insert the final rows.
    const { error: delErr } = await supabase
      .from("referral_leaderboard_snapshots")
      .delete()
      .eq("period_month", monthDate);
    if (delErr) throw delErr;

    if (top.length > 0) {
      const { error: insErr } = await supabase
        .from("referral_leaderboard_snapshots")
        .insert(top);
      if (insErr) throw insErr;
    }

    await supabase.rpc("log_ops_event", {
      p_kind: "referral",
      p_source: "close-referral-month",
      p_status: "success",
      p_message: `Closed ${key} with ${top.length} winners`,
      p_detail: {
        month: key,
        winners: top.map((t) => ({
          rank: t.rank,
          handle: t.x_handle,
          wallet: t.wallet_address,
          points: t.points,
          potSharePct: t.pot_share_pct,
        })),
      },
      p_duration_ms: Date.now() - started,
    });

    return json({ success: true, month: key, winners: top });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    console.error("close-referral-month error:", message);
    await supabase.rpc("log_ops_event", {
      p_kind: "referral",
      p_source: "close-referral-month",
      p_status: "failure",
      p_message: message,
      p_detail: {},
      p_duration_ms: Date.now() - started,
    }).catch(() => {});
    return json({ error: message }, 500);
  }
});
