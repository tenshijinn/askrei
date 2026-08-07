import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OpsMonitorHealth = {
  kind: string;
  source: string;
  label: string;
  max_silence_hours: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  failures_24h: number;
  successes_24h: number;
  hours_since_success: number | null;
  state: "healthy" | "failing" | "stale" | "unknown";
};

export type OpsCronHealth = {
  jobname: string;
  schedule: string;
  active: boolean;
  last_run: string | null;
  last_status: string | null;
  failures_7d: number;
};

export type OpsEvent = {
  id: string;
  kind: string;
  source: string;
  status: string;
  message: string | null;
  // Kept to JSON scalars so the payload stays serializable across the RPC boundary.
  detail: Record<string, string | number | boolean | null> | null;
  duration_ms: number | null;
  created_at: string;
};

export type OpsOverview = {
  monitors: OpsMonitorHealth[];
  cron: OpsCronHealth[];
  recentFailures: OpsEvent[];
  recentEvents: OpsEvent[];
  alerts: string[];
  generatedAt: string;
};

/**
 * Admin-only monitoring overview: monitor health, scheduler history, and the
 * latest failures. Reads run with elevated privileges only after the caller's
 * admin role is confirmed against their own session.
 */
export const getOpsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OpsOverview> => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(`Role check failed: ${roleError.message}`);
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [healthRes, cronRes, failRes, eventsRes] = await Promise.all([
      supabaseAdmin.rpc("ops_health"),
      supabaseAdmin.rpc("ops_cron_health"),
      supabaseAdmin
        .from("ops_events")
        .select("*")
        .in("status", ["failure", "warning"])
        .order("created_at", { ascending: false })
        .limit(25),
      supabaseAdmin
        .from("ops_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    if (healthRes.error) throw new Error(healthRes.error.message);
    if (cronRes.error) throw new Error(cronRes.error.message);

    const monitors = (healthRes.data ?? []) as OpsMonitorHealth[];
    const cron = (cronRes.data ?? []) as OpsCronHealth[];

    const alerts: string[] = [];
    for (const m of monitors) {
      if (m.state === "stale") {
        alerts.push(
          `${m.label} has not succeeded in ${m.hours_since_success ?? "?"}h (limit ${m.max_silence_hours}h).`,
        );
      } else if (m.state === "failing") {
        alerts.push(`${m.label} recorded ${m.failures_24h} failure(s) in the last 24h.`);
      } else if (m.state === "unknown") {
        alerts.push(`${m.label} has never reported a successful run yet.`);
      }
    }
    for (const j of cron) {
      if (!j.active) alerts.push(`Schedule "${j.jobname}" is disabled.`);
      else if (j.failures_7d > 0) {
        alerts.push(`Schedule "${j.jobname}" failed ${j.failures_7d} time(s) in the last 7 days.`);
      }
    }

    return {
      monitors,
      cron,
      recentFailures: (failRes.data ?? []) as OpsEvent[],
      recentEvents: (eventsRes.data ?? []) as OpsEvent[],
      alerts,
      generatedAt: new Date().toISOString(),
    };
  });
