import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { x_user_id, wallet_address } = await req.json();
    if (!x_user_id && !wallet_address) {
      return new Response(JSON.stringify({ error: "x_user_id or wallet_address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const deleted: Record<string, number | string> = {};
    const errors: Record<string, string> = {};

    const del = async (
      table: string,
      column: string,
      value: string | null | undefined,
    ) => {
      if (!value) return;
      const { error, count } = await supabase
        .from(table)
        .delete({ count: "exact" })
        .eq(column, value);
      if (error) errors[`${table}.${column}`] = error.message;
      else deleted[`${table}.${column}`] = count ?? 0;
    };

    // Chat: delete messages first via conversation ids, then conversations
    if (wallet_address) {
      const { data: convs } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("wallet_address", wallet_address);
      const convIds = (convs || []).map((c: { id: string }) => c.id);
      if (convIds.length) {
        const { error: msgErr, count: msgCount } = await supabase
          .from("chat_messages")
          .delete({ count: "exact" })
          .in("conversation_id", convIds);
        if (msgErr) errors["chat_messages"] = msgErr.message;
        else deleted["chat_messages"] = msgCount ?? 0;
      }
    }

    // Delete user-scoped rows across tables
    await del("chat_conversations", "wallet_address", wallet_address);
    await del("points_transactions", "wallet_address", wallet_address);
    await del("user_points", "wallet_address", wallet_address);
    await del("user_points", "x_user_id", x_user_id);
    await del("payment_references", "wallet_address", wallet_address);
    await del("referral_clicks", "wallet_address", wallet_address);
    await del("referral_conversions", "wallet_address", wallet_address);
    await del("referral_codes", "wallet_address", wallet_address);
    await del("campaign_clicks", "wallet_address", wallet_address);
    await del("campaign_subscriptions", "wallet_address", wallet_address);
    await del("campaign_subscriptions", "x_user_id", x_user_id);
    await del("community_submissions", "wallet_address", wallet_address);
    await del("subscriptions", "wallet_address", wallet_address);
    await del("agent_api_keys", "wallet_address", wallet_address);
    await del("tasks", "wallet_address", wallet_address);
    await del("twitter_whitelist_submissions", "x_user_id", x_user_id);
    await del("x_follow_checks", "x_user_id", x_user_id);
    await del("rei_registry", "x_user_id", x_user_id);

    return new Response(JSON.stringify({ ok: true, deleted, errors }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
