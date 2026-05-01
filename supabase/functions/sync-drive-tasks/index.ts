// Pulls a bounty/task JSON file from Google Drive (via the Lovable connector
// gateway) and upserts each entry into public.tasks on external_id.
//
// Trigger: pg_cron every 3 days, or manual POST { file_id?: string }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_drive";

const RewardSchema = z
  .object({
    amount: z.union([z.number(), z.string()]).nullable().optional(),
    currency: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

const BountySchema = z.object({
  id: z.string().min(1),
  platform: z.string().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  reward: RewardSchema,
  deadline: z.string().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  url: z.string().min(1),
  sponsor: z.string().nullable().optional(),
  posted_at: z.string().nullable().optional(),
  fetched_at: z.string().nullable().optional(),
});

const PayloadSchema = z.object({
  generated_at: z.string().optional(),
  bounties: z.array(z.unknown()),
});

type Bounty = z.infer<typeof BountySchema>;

function formatCompensation(reward: Bounty["reward"]): string | null {
  if (!reward) return null;
  const amount =
    typeof reward.amount === "number"
      ? reward.amount
      : typeof reward.amount === "string"
      ? Number(reward.amount)
      : null;
  if (amount == null || Number.isNaN(amount)) return null;
  const currency = reward.currency ?? "USD";
  // 10000 USDC -> "10,000 USDC"
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

function safeDate(s?: string | null): string | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function mapBounty(b: Bounty) {
  const description =
    b.description?.trim() ||
    `${b.sponsor ?? "Unknown"} bounty${b.platform ? ` on ${b.platform}` : ""}.`;

  const role_tags = [
    ...(b.skills ?? []),
    ...(b.platform ? [b.platform] : []),
  ].filter(Boolean);

  return {
    external_id: b.id,
    title: b.title.slice(0, 500),
    description,
    link: b.url,
    compensation: formatCompensation(b.reward),
    end_date: safeDate(b.deadline),
    company_name: b.sponsor ?? null,
    role_tags,
    source: "gdrive-aggregator",
    opportunity_type: "task",
    status: "active",
    // Satisfy NOT NULL + UNIQUE constraints. Unique per external_id.
    payment_tx_signature: `gdrive:${b.id}`,
    employer_wallet: "gdrive:aggregator",
    updated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const DEFAULT_FILE_ID = Deno.env.get("DRIVE_TASKS_FILE_ID");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!GOOGLE_DRIVE_API_KEY)
      throw new Error("GOOGLE_DRIVE_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
      throw new Error("Supabase service env not configured");

    const DEFAULT_FOLDER_ID = Deno.env.get("DRIVE_TASKS_FOLDER_ID");

    let body: { file_id?: string; folder_id?: string } = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    let fileId = body.file_id || DEFAULT_FILE_ID;
    const folderId = body.folder_id || DEFAULT_FOLDER_ID;

    // If a folder is configured, find the latest JSON file inside it.
    if (!body.file_id && folderId) {
      const q = encodeURIComponent(
        `'${folderId}' in parents and trashed = false and (mimeType = 'application/json' or name contains '.json')`,
      );
      const listUrl =
        `${GATEWAY_URL}/drive/v3/files?q=${q}` +
        `&orderBy=${encodeURIComponent("createdTime desc")}` +
        `&pageSize=10` +
        `&fields=${encodeURIComponent("files(id,name,mimeType,createdTime,modifiedTime)")}`;

      const listRes = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
        },
      });
      if (!listRes.ok) {
        const txt = await listRes.text();
        throw new Error(
          `Drive folder list failed [${listRes.status}]: ${txt.slice(0, 500)}`,
        );
      }
      const listJson = (await listRes.json()) as {
        files?: { id: string; name: string; createdTime?: string }[];
      };
      const latest = listJson.files?.[0];
      if (!latest) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: `No JSON files found in folder ${folderId}`,
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      fileId = latest.id;
      console.log(
        `Selected latest file in folder ${folderId}: ${latest.name} (${latest.id}, created ${latest.createdTime})`,
      );
    }

    if (!fileId) {
      return new Response(
        JSON.stringify({
          error:
            "No file_id. Set DRIVE_TASKS_FOLDER_ID or DRIVE_TASKS_FILE_ID secret, or pass { file_id } / { folder_id } in body.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 1. Download JSON from Drive via gateway
    const driveRes = await fetch(
      `${GATEWAY_URL}/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
        },
      },
    );

    if (!driveRes.ok) {
      const txt = await driveRes.text();
      throw new Error(
        `Drive download failed [${driveRes.status}]: ${txt.slice(0, 500)}`,
      );
    }

    const raw = await driveRes.json();
    const parsed = PayloadSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Payload missing 'bounties' array: ${JSON.stringify(parsed.error.flatten())}`,
      );
    }

    // 2. Validate + map each bounty individually so a few bad rows don't kill the run.
    const rows: ReturnType<typeof mapBounty>[] = [];
    const skipped: { id?: string; reason: string }[] = [];
    for (const item of parsed.data.bounties) {
      const r = BountySchema.safeParse(item);
      if (!r.success) {
        skipped.push({
          id: (item as { id?: string })?.id,
          reason: r.error.issues[0]?.message ?? "validation",
        });
        continue;
      }
      rows.push(mapBounty(r.data));
    }

    // 3. Upsert in chunks of 200 to keep payloads reasonable.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    let upserted = 0;
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const { error, count } = await supabase
        .from("tasks")
        .upsert(chunk, { onConflict: "external_id", count: "exact" });
      if (error) {
        errors.push(`chunk ${i}: ${error.message}`);
      } else {
        upserted += count ?? chunk.length;
      }
    }

    return new Response(
      JSON.stringify({
        ok: errors.length === 0,
        file_id: fileId,
        fetched: parsed.data.bounties.length,
        upserted,
        skipped: skipped.length,
        skipped_sample: skipped.slice(0, 5),
        errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("sync-drive-tasks error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
