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
    else throw new Error("stripe_subscription_id or campaign_subscription_id required");

    const { data: campaign, error: cErr } = await query.maybeSingle();
    if (cErr || !campaign) throw new Error("Campaign subscription not found");

    if (campaign.status !== "active") {
      return json({ skipped: true, reason: "subscription not active" });
    }
    if (campaign.expires_at && new Date(campaign.expires_at) < new Date()) {
      return json({ skipped: true, reason: "subscription expired" });
    }

    // Soft scrape
    const html = await softScrape(campaign.project_link);

    // AI extraction
    const tasks = await extractTasksWithAI({
      projectName: campaign.project_name,
      projectLink: campaign.project_link,
      html,
      screenshotUrl: campaign.screenshot_url,
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
        og_image: campaign.screenshot_url,
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

    // Update campaign tracking
    await supabase
      .from("campaign_subscriptions")
      .update({
        last_scraped_at: new Date().toISOString(),
        scrape_count: (campaign.scrape_count || 0) + 1,
        tasks_imported_count: (campaign.tasks_imported_count || 0) + imported,
        last_error: null,
      })
      .eq("id", campaign.id);

    return json({ success: true, scraped: tasks.length, imported });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("scrape-campaign-tasks error:", message);
    return json({ success: false, error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function softScrape(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ReiBot/1.0; +https://askrei.lovable.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Strip scripts/styles, keep body text + structure
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .slice(0, 60000); // cap for AI
  } catch (e) {
    console.error("Scrape fetch failed:", e);
    return "";
  }
}

async function extractTasksWithAI(input: {
  projectName: string;
  projectLink: string;
  html: string;
  screenshotUrl?: string | null;
}): Promise<ExtractedTask[]> {
  const userContent: any[] = [
    {
      type: "text",
      text: `Extract every individual task / quest / bounty from this campaign page.

Project: ${input.projectName}
URL: ${input.projectLink}

For each task return: title, description (1-2 sentences), compensation (if shown), role_tags (e.g. dev, design, community, content, research), end_date (ISO if visible), external_id (a stable slug from the task title — lowercase, hyphenated).

If the page is empty / login-walled / has no detectable tasks, return an empty array.

HTML (truncated):
\`\`\`html
${input.html.slice(0, 50000)}
\`\`\``,
    },
  ];

  if (input.screenshotUrl) {
    userContent.push({ type: "image_url", image_url: { url: input.screenshotUrl } });
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
            "You extract structured task / quest data from Web3 campaign pages (Galxe, Zealy, QuestN, TaskOn, Layer3, custom). Always call the save_tasks tool. Skip cookie banners, navigation, and footer text. Be precise.",
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
    console.error("AI gateway error:", response.status, txt);
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
