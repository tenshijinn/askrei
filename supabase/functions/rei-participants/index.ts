// Public list of Rei registry participants — display fields only.
// Reads with the service role so the registry stays RLS-gated for direct
// client access (paid talent unlocks etc.), while exposing a safe subset.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function subscore(behaviour: unknown, key: string): number | null {
  const raw = (behaviour as any)?.subscores?.[key]?.score;
  return typeof raw === "number" ? Math.round(raw) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("rei_registry")
      .select(
        "id, x_user_id, handle, display_name, profile_image_url, verified, wallet_address, evm_wallet_address, diamond_score, diamond_tier, wallet_behaviour, created_at",
      )
      .order("diamond_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    const participants = (data ?? []).map((r) => {
      const risk = subscore(r.wallet_behaviour, "risk");
      return {
        id: r.id,
        handle: r.handle,
        displayName: r.display_name,
        profileImageUrl: r.profile_image_url,
        verified: !!r.verified,
        solWallet: r.wallet_address,
        evmWallet: r.evm_wallet_address,
        diamondScore: typeof r.diamond_score === "number" ? r.diamond_score : null,
        diamondTier: r.diamond_tier ?? (r.wallet_behaviour as any)?.diamond_tier ?? null,
        community: subscore(r.wallet_behaviour, "community"),
        confidence: subscore(r.wallet_behaviour, "confidence"),
        // Trust is derived: risk 0 = fully trusted.
        trust: risk === null ? null : Math.max(0, Math.min(100, 100 - risk)),
        createdAt: r.created_at,
      };
    });

    return new Response(JSON.stringify({ participants, count: participants.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("rei-participants error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
