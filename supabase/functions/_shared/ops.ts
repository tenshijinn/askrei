// Shared operational-event logger.
// Records webhook deliveries and scheduled-job runs into public.ops_events so
// the admin monitoring dashboard and the watchdog can spot failures fast.

import { createClient } from "npm:@supabase/supabase-js@2";

export type OpsKind = "webhook" | "job";
export type OpsStatus = "success" | "failure" | "warning";

function client() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/**
 * Best-effort event write — never throws, so monitoring can't break the caller.
 */
export async function logOpsEvent(opts: {
  kind: OpsKind;
  source: string;
  status: OpsStatus;
  message?: string;
  detail?: Record<string, unknown>;
  durationMs?: number;
}): Promise<void> {
  try {
    const { error } = await client().rpc("log_ops_event", {
      p_kind: opts.kind,
      p_source: opts.source,
      p_status: opts.status,
      p_message: opts.message ?? null,
      p_detail: opts.detail ?? {},
      p_duration_ms: opts.durationMs ?? null,
    });
    if (error) console.error("[ops] failed to log event:", error.message);
  } catch (err) {
    console.error("[ops] failed to log event:", err);
  }
}

/**
 * Wraps a scheduled-job body: times it, logs success or failure, and rethrows
 * so the runner still sees the failure.
 */
export async function withOpsJob<T>(source: string, run: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await run();
    await logOpsEvent({
      kind: "job",
      source,
      status: "success",
      durationMs: Date.now() - startedAt,
      detail: typeof result === "object" && result !== null
        ? (result as Record<string, unknown>)
        : {},
    });
    return result;
  } catch (err) {
    await logOpsEvent({
      kind: "job",
      source,
      status: "failure",
      message: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startedAt,
    });
    throw err;
  }
}

/**
 * Wraps a Deno.serve handler for a scheduled function: records one ops_event
 * per invocation based on the HTTP status it returns (or the error it throws).
 * CORS preflights are ignored.
 */
export function withOpsHttpJob(
  source: string,
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    if (req.method === "OPTIONS") return handler(req);
    const startedAt = Date.now();
    try {
      const res = await handler(req);
      const ok = res.ok;
      let detail: Record<string, unknown> = { status: res.status };
      if (!ok) {
        try {
          detail = { status: res.status, body: (await res.clone().text()).slice(0, 500) };
        } catch {
          /* body already consumed — keep the status only */
        }
      }
      await logOpsEvent({
        kind: "job",
        source,
        status: ok ? "success" : "failure",
        message: ok ? undefined : `HTTP ${res.status}`,
        detail,
        durationMs: Date.now() - startedAt,
      });
      return res;
    } catch (err) {
      await logOpsEvent({
        kind: "job",
        source,
        status: "failure",
        message: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startedAt,
      });
      throw err;
    }
  };
}
