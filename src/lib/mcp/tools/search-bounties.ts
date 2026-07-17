import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "search_bounties",
  title: "Search bounties",
  description:
    "Search active crypto bounties and tasks aggregated on rei.chat (Superteam, Zealy, QuestN, Scribble, and others). Filter by keyword, role tag, or platform.",
  inputSchema: {
    query: z.string().optional().describe("Case-insensitive match on title / description / company_name."),
    role: z.string().optional().describe("Role tag, e.g. developer, designer, kol, writer, or platform tag like scribble, zealy."),
    limit: z.number().int().min(1).max(50).default(20).describe("Max rows to return (1-50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ query, role, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = sb(ctx)
      .from("v_public_tasks")
      .select("id, title, description, link, role_tags, compensation, company_name, end_date, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%,company_name.ilike.%${query}%`);
    if (role) q = q.contains("role_tags", [role]);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { bounties: data ?? [], count: data?.length ?? 0 },
    };
  },
});
