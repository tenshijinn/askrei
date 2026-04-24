import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

interface ExtractedTask {
  title: string;
  description: string;
  compensation?: string;
  role_tags?: string[];
  external_id: string;
  end_date?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { stripe_subscription_id, campaign_subscription_id } = await req.json();

    let query = supabase.from("campaign_subscriptions").select("*");
    if (stripe_subscription_id) query = query.eq("stripe_subscription_id", stripe_subscription_id);
    else if (campaign_subscription_id) query = query.eq("id", campaign_subscription_id);
    else throw new Error("subscription identifier required");

    const { data: campaign, error: cErr } = await query.maybeSingle();
    if (cErr || !campaign) throw new Error("Campaign not found");

    if (campaign.status !== "active") {
      return json({ skipped: true, reason: "inactive" });
    }
    if (campaign.expires_at && new Date(campaign.expires_at) < new Date()) {
      return json({ skipped: true, reason: "expired" });
    }

    // Fetch rendered page content + visual via Firecrawl
    const page = await fetchPageContent(campaign.project_link);

    // Extract tasks via AI from markdown + (optional) visual
    const visualUrl = page.screenshot || campaign.screenshot_url || null;
    const tasks = await extractTasksWithAI({
      projectName: campaign.project_name,
      projectLink: campaign.project_link,
      content: page.markdown || page.html || "",
      visualUrl,
    });

    // Insert / dedupe
    let imported = 0;
    for (const t of tasks) {
      const externalId = `${campaign.id}:${t.external_id}`;
      const { data: existing } = await supabase
        .from("tasks")
        .select("id")
        .eq("external_id", externalId)
        .maybeSingle();
      if (existing) continue;

      const { error: insErr } = await supabase.from("tasks").insert({
        title: t.title.slice(0, 500),
        description: t.description.slice(0, 5000),
        compensation: t.compensation || null,
        role_tags: t.role_tags || [],
        link: campaign.project_link,
        og_image: visualUrl,
        employer_wallet: `email:${campaign.customer_email}`,
        payment_tx_signature: `stripe:${campaign.stripe_subscription_id}`,
        opportunity_type: "task",
        source: "unlimited-posts",
        external_id: externalId,
        company_name: campaign.project_name,
        end_date: t.end_date || campaign.expires_at,
        status: "active",
        campaign_subscription_id: campaign.id,
      });
      if (insErr) console.error("Task insert failed:", insErr);
      else imported++;
    }

    // Update campaign tracking + refreshed visual
    const updates: Record<string, unknown> = {
      last_scraped_at: new Date().toISOString(),
      scrape_count: (campaign.scrape_count || 0) + 1,
      tasks_imported_count: (campaign.tasks_imported_count || 0) + imported,
      last_error: null,
    };
    if (page.screenshot) updates.screenshot_url = page.screenshot;

    await supabase
      .from("campaign_subscriptions")
      .update(updates)
      .eq("id", campaign.id);

    return json({ success: true, found: tasks.length, imported });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("sync error:", message);
    // Persist last_error for internal debugging
    try {
      const body = await req.clone().json().catch(() => ({}));
      const id = body.campaign_subscription_id;
      const sid = body.stripe_subscription_id;
      if (id || sid) {
        const filter = id
          ? supabase.from("campaign_subscriptions").update({ last_error: message }).eq("id", id)
          : supabase.from("campaign_subscriptions").update({ last_error: message }).eq("stripe_subscription_id", sid);
        await filter;
      }
    } catch (_) { /* noop */ }
    return json({ success: false, error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchPageContent(url: string): Promise<{ markdown: string; html: string; screenshot: string | null }> {
  if (!FIRECRAWL_API_KEY) {
    console.warn("FIRECRAWL_API_KEY not set; returning empty content");
    return { markdown: "", html: "", screenshot: null };
  }

  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "screenshot"],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("firecrawl error:", res.status, txt);
      return { markdown: "", html: "", screenshot: null };
    }

    const data = await res.json();
    // SDK/REST shapes: fields can be on root or under data
    const root = data?.data ?? data;
    return {
      markdown: typeof root?.markdown === "string" ? root.markdown : "",
      html: typeof root?.html === "string" ? root.html : "",
      screenshot: typeof root?.screenshot === "string" ? root.screenshot : null,
    };
  } catch (e) {
    console.error("firecrawl exception:", e);
    return { markdown: "", html: "", screenshot: null };
  }
}

async function extractTasksWithAI(input: {
  projectName: string;
  projectLink: string;
  content: string;
  visualUrl?: string | null;
}): Promise<ExtractedTask[]> {
  if (!input.content && !input.visualUrl) return [];

  const userContent: any[] = [
    {
      type: "text",
      text: `Extract every individual task / quest / bounty from this campaign page.

Project: ${input.projectName}
URL: ${input.projectLink}

For each task return: title, description (1-2 sentences), compensation (if shown), role_tags (e.g. dev, design, community, content, research), end_date (ISO if visible), external_id (a stable slug from the task title — lowercase, hyphenated).

If the page is empty / login-walled / has no detectable tasks, return an empty array.

Page content (markdown):
\`\`\`
${input.content.slice(0, 50000)}
\`\`\``,
    },
  ];

  if (input.visualUrl) {
    userContent.push({ type: "image_url", image_url: { url: input.visualUrl } });
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You extract structured task / quest data from Web3 campaign pages. Always call the save_tasks tool. Skip cookie banners, navigation, and footer text. Be precise.",
        },
        { role: "user", content: userContent },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_tasks",
            description: "Persist the list of tasks extracted from the campaign page",
            parameters: {
              type: "object",
              properties: {
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      compensation: { type: "string" },
                      role_tags: { type: "array", items: { type: "string" } },
                      end_date: { type: "string" },
                      external_id: { type: "string" },
                    },
                    required: ["title", "description", "external_id"],
                  },
                },
              },
              required: ["tasks"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_tasks" } },
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    console.error("ai gateway error:", response.status, txt);
    return [];
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return [];
  try {
    const args = JSON.parse(toolCall.function.arguments);
    return Array.isArray(args.tasks) ? args.tasks : [];
  } catch {
    return [];
  }
}
