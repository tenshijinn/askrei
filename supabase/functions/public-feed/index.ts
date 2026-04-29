// Public, read-only feed for the Rei agent (OpenClaw) and any external consumer.
// Exposes ONLY public-safe content: active tasks, active jobs, skill categories.
// No user PII, no wallets, no payment signatures, no talent profiles.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// In-memory token bucket per key id (resets on cold start; good enough for soft limits).
const buckets = new Map<string, { count: number; minute: number }>();

interface KeyContext { id: string | null; rate: number }

async function checkApiKey(req: Request): Promise<{ ok: true; ctx: KeyContext } | { ok: false; res: Response }> {
  const provided = (req.headers.get("x-api-key") ?? "").trim();
  if (!provided) return { ok: false, res: json({ error: "Missing x-api-key" }, 401) };

  // 1) Legacy env-secret keys (Rei/OpenClaw internal)
  const allowed = (Deno.env.get("REI_AGENT_API_KEYS") ?? "").trim();
  if (allowed) {
    const envKeys = allowed.split(",").map((k) => k.trim()).filter(Boolean);
    if (envKeys.includes(provided)) return { ok: true, ctx: { id: null, rate: 1000 } };
  }

  // 2) DB-backed agent keys (sold via /agents)
  const hash = await sha256Hex(provided);
  const { data, error } = await supabase
    .from("agent_api_keys")
    .select("id, rate_limit_per_min, expires_at, revoked")
    .eq("key_hash", hash)
    .maybeSingle();
  if (error || !data) return { ok: false, res: json({ error: "Invalid x-api-key" }, 401) };
  if (data.revoked) return { ok: false, res: json({ error: "Key revoked" }, 401) };
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { ok: false, res: json({ error: "Key expired" }, 401) };
  }

  // Rate limit
  const minute = Math.floor(Date.now() / 60000);
  const b = buckets.get(data.id);
  if (!b || b.minute !== minute) {
    buckets.set(data.id, { count: 1, minute });
  } else {
    b.count += 1;
    if (b.count > data.rate_limit_per_min) {
      return { ok: false, res: json({ error: "Rate limit exceeded" }, 429) };
    }
  }
  return { ok: true, ctx: { id: data.id, rate: data.rate_limit_per_min } };
}

// Fire-and-forget usage logging
function logUsage(ctx: KeyContext, endpoint: string, status: number) {
  if (!ctx.id) return;
  supabase.from("agent_api_usage").insert({ api_key_id: ctx.id, endpoint, status }).then(
    () => {}, () => {},
  );
  supabase.from("agent_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", ctx.id).then(
    () => {}, () => {},
  );
}

function parseListParams(url: URL) {
  const limitRaw = parseInt(url.searchParams.get("limit") ?? "", 10);
  const offsetRaw = parseInt(url.searchParams.get("offset") ?? "", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 200);
  const role = (url.searchParams.get("role") ?? "").trim().slice(0, 100);
  const skill = (url.searchParams.get("skill_category_id") ?? "").trim();
  const sinceRaw = url.searchParams.get("since");
  let since: string | null = null;
  if (sinceRaw) {
    const d = new Date(sinceRaw);
    if (!isNaN(d.getTime())) since = d.toISOString();
  }
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const skillCategoryId = isUuid.test(skill) ? skill : null;
  return { limit, offset, q, role, skillCategoryId, since };
}

function escapeIlike(s: string) {
  return s.replace(/[\\%_]/g, (m) => "\\" + m);
}

async function listFromView(
  view: "v_public_tasks" | "v_public_jobs",
  url: URL,
) {
  const { limit, offset, q, role, skillCategoryId, since } = parseListParams(url);
  let query = supabase.from(view).select("*", { count: "exact" });
  if (q) {
    const safe = `%${escapeIlike(q)}%`;
    query = query.or(`title.ilike.${safe},description.ilike.${safe},company_name.ilike.${safe}`);
  }
  if (role) query = query.contains("role_tags", [role]);
  if (skillCategoryId) query = query.contains("skill_category_ids", [skillCategoryId]);
  if (since) query = query.gt("created_at", since);
  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) return json({ error: error.message }, 500);
  const next = data && data.length === limit ? data[data.length - 1].created_at : null;
  return json({ data: data ?? [], count: count ?? 0, next_cursor: next, limit, offset });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const gate = await checkApiKey(req);
  if (!gate.ok) return gate.res;
  const ctx = gate.ctx;

  const url = new URL(req.url);
  // path is /public-feed/<rest>
  const path = url.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
  // drop the function name segment
  const segs = path[0] === "public-feed" ? path.slice(1) : path;
  const route = segs[0] ?? "";
  const id = segs[1] ?? null;

  let res: Response;
  try {
    switch (route) {
      case "":
      case "health":
        res = json({
          ok: true,
          name: "rei-public-feed",
          endpoints: [
            "GET /tasks",
            "GET /tasks/:id",
            "GET /jobs",
            "GET /jobs/:id",
            "GET /skill-categories",
            "GET /feed",
          ],
        });
        break;

      case "tasks": {
        if (id) {
          if (!UUID.test(id)) { res = json({ error: "Invalid id" }, 400); break; }
          const { data, error } = await supabase
            .from("v_public_tasks").select("*").eq("id", id).maybeSingle();
          if (error) { res = json({ error: error.message }, 500); break; }
          if (!data) { res = json({ error: "Not found" }, 404); break; }
          res = json({ data });
        } else {
          res = await listFromView("v_public_tasks", url);
        }
        break;
      }

      case "jobs": {
        if (id) {
          if (!UUID.test(id)) { res = json({ error: "Invalid id" }, 400); break; }
          const { data, error } = await supabase
            .from("v_public_jobs").select("*").eq("id", id).maybeSingle();
          if (error) { res = json({ error: error.message }, 500); break; }
          if (!data) { res = json({ error: "Not found" }, 404); break; }
          res = json({ data });
        } else {
          res = await listFromView("v_public_jobs", url);
        }
        break;
      }

      case "skill-categories": {
        const { data, error } = await supabase
          .from("skill_categories")
          .select("id,name,description,keywords,parent_category_id,task_count,job_count,talent_count")
          .order("name", { ascending: true });
        res = error ? json({ error: error.message }, 500) : json({ data: data ?? [], count: data?.length ?? 0 });
        break;
      }

      case "feed": {
        const { limit, since } = parseListParams(url);
        const half = Math.ceil(limit / 2);
        let tQ = supabase.from("v_public_tasks").select("*").order("created_at", { ascending: false }).limit(half);
        let jQ = supabase.from("v_public_jobs").select("*").order("created_at", { ascending: false }).limit(half);
        if (since) { tQ = tQ.gt("created_at", since); jQ = jQ.gt("created_at", since); }
        const [tasks, jobs] = await Promise.all([tQ, jQ]);
        if (tasks.error) { res = json({ error: tasks.error.message }, 500); break; }
        if (jobs.error) { res = json({ error: jobs.error.message }, 500); break; }
        const merged = [
          ...(tasks.data ?? []).map((r) => ({ kind: "task", ...r })),
          ...(jobs.data ?? []).map((r) => ({ kind: "job", ...r })),
        ]
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
          .slice(0, limit);
        const next = merged.length === limit ? merged[merged.length - 1].created_at : null;
        res = json({ data: merged, count: merged.length, next_cursor: next, limit });
        break;
      }

      default:
        res = json({ error: "Unknown endpoint", path: "/" + segs.join("/") }, 404);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    res = json({ error: msg }, 500);
  }
  logUsage(ctx, route || "/", res.status);
  return res;
});
