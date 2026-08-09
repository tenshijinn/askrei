// Per-campaign participants — publisher-only.
// Returns the signed-in Rei members who engaged (impression / click) with a
// specific campaign, but ONLY to the publisher who owns that campaign.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function subscore(behaviour: unknown, key: string): number | null {
  const raw = (behaviour as any)?.subscores?.[key]?.score;
  return typeof raw === "number" ? Math.round(raw) : null;
}

function str(v: unknown, max = 128): string | null {
  return typeof v === "string" && v.trim() && v.length <= max ? v.trim() : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json().catch(() => ({}));
    const campaignId = str(body.campaignId, 64);
    const requesterXUserId = str(body.requesterXUserId, 64);
    const requesterWallet = str(body.requesterWallet, 128);

    if (!campaignId || !UUID_RE.test(campaignId)) return json({ error: "invalid campaignId" }, 400);
    if (!requesterXUserId && !requesterWallet) return json({ error: "requester required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Ownership check — the caller must own this campaign.
    const { data: campaign, error: campErr } = await supabase
      .from("campaign_subscriptions")
      .select("id, x_user_id, wallet_address")
      .eq("id", campaignId)
      .maybeSingle();
    if (campErr) throw campErr;

    const owns =
      !!campaign &&
      ((requesterXUserId && campaign.x_user_id === requesterXUserId) ||
        (requesterWallet && campaign.wallet_address === requesterWallet));

    if (!owns) return json({ error: "Not found" }, 404);

    // Engagements attributed to signed-in members.
    const [clicksRes, impsRes] = await Promise.all([
      supabase
        .from("campaign_clicks")
        .select("viewer_x_user_id, viewer_wallet_address, clicked_at")
        .eq("campaign_subscription_id", campaignId)
        .not("viewer_x_user_id", "is", null)
        .limit(5000),
      supabase
        .from("campaign_impressions")
        .select("viewer_x_user_id, viewer_wallet_address, viewed_at")
        .eq("campaign_subscription_id", campaignId)
        .not("viewer_x_user_id", "is", null)
        .limit(5000),
    ]);
    if (clicksRes.error) throw clicksRes.error;
    if (impsRes.error) throw impsRes.error;

    type Agg = { clicks: number; impressions: number; firstSeen: string; lastSeen: string };
    const agg = new Map<string, Agg>();
    const bump = (id: string | null, at: string, kind: "clicks" | "impressions") => {
      if (!id) return;
      const cur = agg.get(id) ?? { clicks: 0, impressions: 0, firstSeen: at, lastSeen: at };
      cur[kind] += 1;
      if (at < cur.firstSeen) cur.firstSeen = at;
      if (at > cur.lastSeen) cur.lastSeen = at;
      agg.set(id, cur);
    };
    for (const r of clicksRes.data ?? []) bump(r.viewer_x_user_id, r.clicked_at, "clicks");
    for (const r of impsRes.data ?? []) bump(r.viewer_x_user_id, r.viewed_at, "impressions");

    const ids = [...agg.keys()];
    if (ids.length === 0) return json({ participants: [], count: 0 });

    const { data: members, error: memErr } = await supabase
      .from("rei_registry")
      .select(
        "id, x_user_id, handle, display_name, profile_image_url, verified, wallet_address, evm_wallet_address, diamond_score, diamond_tier, wallet_behaviour, created_at",
      )
      .in("x_user_id", ids);
    if (memErr) throw memErr;

    const participants = (members ?? []).map((r) => {
      const risk = subscore(r.wallet_behaviour, "risk");
      const a = agg.get(r.x_user_id as string)!;
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
        clicks: a.clicks,
        impressions: a.impressions,
        firstSeen: a.firstSeen,
        lastSeen: a.lastSeen,
      };
    });

    participants.sort(
      (x, y) => (y.diamondScore ?? -1) - (x.diamondScore ?? -1) || y.clicks - x.clicks,
    );

    return json({ participants, count: participants.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("campaign-participants error:", message);
    return json({ error: "Failed to load participants" }, 500);
  }
});
