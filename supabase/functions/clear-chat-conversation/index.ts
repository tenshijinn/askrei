import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReqBody {
  walletAddress?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let body: ReqBody = {};
    try {
      body = await req.json();
    } catch {
      // empty body is allowed
    }

    const walletAddress = (body.walletAddress || "").trim();
    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: "walletAddress required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Find the user's conversation row(s)
    const { data: convs, error: convErr } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("wallet_address", walletAddress);

    if (convErr) {
      console.error("[clear-chat-conversation] conv lookup error:", convErr);
      return new Response(JSON.stringify({ error: convErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids = (convs || []).map((c: { id: string }) => c.id);
    let deletedMessages = 0;
    let deletedConversations = 0;

    if (ids.length > 0) {
      const { error: msgErr, count: msgCount } = await supabase
        .from("chat_messages")
        .delete({ count: "exact" })
        .in("conversation_id", ids);

      if (msgErr) {
        console.error("[clear-chat-conversation] msg delete error:", msgErr);
        return new Response(JSON.stringify({ error: msgErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      deletedMessages = msgCount || 0;

      const { error: convDelErr, count: convCount } = await supabase
        .from("chat_conversations")
        .delete({ count: "exact" })
        .in("id", ids);

      if (convDelErr) {
        console.error("[clear-chat-conversation] conv delete error:", convDelErr);
        return new Response(JSON.stringify({ error: convDelErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      deletedConversations = convCount || 0;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        deletedMessages,
        deletedConversations,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[clear-chat-conversation] unexpected:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
