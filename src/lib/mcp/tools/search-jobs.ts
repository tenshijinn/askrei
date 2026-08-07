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
  name: "search_jobs",
  title: "Search jobs",
  description: "Search active Web3 jobs (full-time, contract) aggregated on rei.chat. Filter by keyword or role.",
  inputSchema: {
    query: z.string().optional(),
    role: z.string().optional().describe("Role tag, e.g. developer, designer, marketing."),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ query, role, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = sb(ctx)
      .from("v_public_jobs")
      .select("id, title, description, requirements, link, apply_url, role_tags, compensation, company_name, deadline, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%,company_name.ilike.%${query}%`);
    if (role) q = q.contains("role_tags", [role]);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { jobs: data ?? [], count: data?.length ?? 0 },
    };
  },
});
