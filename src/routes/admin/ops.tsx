import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOpsOverview, type OpsEvent } from "@/lib/ops.functions";

export const Route = createFileRoute("/admin/ops")({
  component: OpsDashboard,
  head: () => ({
    meta: [
      { title: "Ops Monitoring — Rei" },
      {
        name: "description",
        content:
          "Admin health dashboard for Rei's payment webhooks and scheduled jobs, with failure history and alerts.",
      },
      { property: "og:title", content: "Ops Monitoring — Rei" },
      {
        property: "og:description",
        content: "Health of Rei's payment webhooks and scheduled jobs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const STATE_STYLES: Record<string, string> = {
  healthy: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  failing: "text-primary border-primary/40 bg-primary/10",
  stale: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  unknown: "text-muted-foreground border-border bg-muted/20",
};

function ts(value: string | null) {
  if (!value) return "—";
  return new Date(value).toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function EventRow({ e }: { e: OpsEvent }) {
  return (
    <div className="grid grid-cols-[9.5rem_5rem_1fr] gap-3 border-b border-border/50 py-2 text-xs">
      <span className="font-mono text-muted-foreground">{ts(e.created_at)}</span>
      <span
        className={
          e.status === "success"
            ? "font-mono text-emerald-400"
            : e.status === "warning"
              ? "font-mono text-amber-400"
              : "font-mono text-primary"
        }
      >
        {e.status}
      </span>
      <span className="min-w-0">
        <span className="font-mono text-foreground">{e.source}</span>
        {e.message ? (
          <span className="ml-2 break-words text-muted-foreground">{e.message}</span>
        ) : null}
        {e.duration_ms !== null ? (
          <span className="ml-2 text-muted-foreground/60">{e.duration_ms}ms</span>
        ) : null}
      </span>
    </div>
  );
}

function OpsDashboard() {
  const fetchOverview = useServerFn(getOpsOverview);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["ops-overview"],
    queryFn: () => fetchOverview({}),
    refetchInterval: 60_000,
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl text-foreground">ops / monitoring</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Payment webhook deliveries and scheduled job runs. Auto-refreshes every minute.
          </p>
        </div>
        <button
          onClick={() => void refetch()}
          className="rounded border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          {isFetching ? "refreshing…" : "refresh"}
        </button>
      </header>

      {isLoading ? (
        <p className="font-mono text-sm text-muted-foreground">loading…</p>
      ) : error ? (
        <p className="font-mono text-sm text-primary">
          {error instanceof Error && error.message.includes("Forbidden")
            ? "Admin access required."
            : `Failed to load: ${error instanceof Error ? error.message : "unknown error"}`}
        </p>
      ) : data ? (
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 font-mono text-sm uppercase tracking-wide text-muted-foreground">
              Alerts
            </h2>
            {data.alerts.length === 0 ? (
              <p className="rounded border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 font-mono text-xs text-emerald-400">
                All monitors healthy.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.alerts.map((a) => (
                  <li
                    key={a}
                    className="rounded border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs text-primary"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-mono text-sm uppercase tracking-wide text-muted-foreground">
              Monitors
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.monitors.map((m) => (
                <div
                  key={`${m.kind}:${m.source}`}
                  className="rounded border border-border bg-card/40 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm text-foreground">{m.label}</span>
                    <span
                      className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${
                        STATE_STYLES[m.state] ?? STATE_STYLES["unknown"]
                      }`}
                    >
                      {m.state}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-1 font-mono text-[11px] text-muted-foreground">
                    <div className="flex justify-between gap-2">
                      <dt>last success</dt>
                      <dd>{ts(m.last_success_at)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>last failure</dt>
                      <dd>{ts(m.last_failure_at)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>24h ok / fail</dt>
                      <dd>
                        {m.successes_24h} / {m.failures_24h}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>silence limit</dt>
                      <dd>{m.max_silence_hours}h</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-mono text-sm uppercase tracking-wide text-muted-foreground">
              Scheduler
            </h2>
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full font-mono text-xs">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">job</th>
                    <th className="px-3 py-2 text-left">schedule</th>
                    <th className="px-3 py-2 text-left">last run</th>
                    <th className="px-3 py-2 text-left">status</th>
                    <th className="px-3 py-2 text-left">fails 7d</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cron.map((j) => (
                    <tr key={j.jobname} className="border-t border-border/50">
                      <td className="px-3 py-2 text-foreground">
                        {j.jobname}
                        {!j.active ? <span className="ml-2 text-amber-400">(off)</span> : null}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{j.schedule}</td>
                      <td className="px-3 py-2 text-muted-foreground">{ts(j.last_run)}</td>
                      <td
                        className={
                          j.last_status === "succeeded"
                            ? "px-3 py-2 text-emerald-400"
                            : "px-3 py-2 text-primary"
                        }
                      >
                        {j.last_status ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{j.failures_7d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-mono text-sm uppercase tracking-wide text-muted-foreground">
              Recent failures
            </h2>
            {data.recentFailures.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">No failures recorded.</p>
            ) : (
              <div>
                {data.recentFailures.map((e) => (
                  <EventRow key={e.id} e={e} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-mono text-sm uppercase tracking-wide text-muted-foreground">
              Event log
            </h2>
            <div>
              {data.recentEvents.map((e) => (
                <EventRow key={e.id} e={e} />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
