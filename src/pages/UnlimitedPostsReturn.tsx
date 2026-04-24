import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Check, ExternalLink, Loader2, Settings, ListChecks, Calendar, RefreshCw } from "lucide-react";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

interface CampaignStats {
  id: string;
  project_name: string;
  project_link: string;
  status: string;
  tasks_imported_count: number | null;
  scrape_count: number | null;
  last_scraped_at: string | null;
  expires_at: string | null;
  customer_email: string;
  stripe_subscription_id: string;
}

export default function UnlimitedPostsReturn() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  const [campaign, setCampaign] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);

  // Poll for the campaign_subscription row created by the webhook
  useEffect(() => {
    let cancelled = false;
    let attempt = 0;

    const fetchCampaign = async () => {
      const { data } = await supabase
        .from("campaign_subscriptions")
        .select(
          "id, project_name, project_link, status, tasks_imported_count, scrape_count, last_scraped_at, expires_at, customer_email, stripe_subscription_id"
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (data) {
        setCampaign(data as CampaignStats);
        setLoading(false);
        return true;
      }
      return false;
    };

    const poll = async () => {
      const found = await fetchCampaign();
      attempt += 1;
      setPollAttempts(attempt);
      if (!found && attempt < 8 && !cancelled) {
        setTimeout(poll, 2000);
      } else if (!found) {
        setLoading(false);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const openPortal = async () => {
    if (!campaign) return;
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          stripeSubscriptionId: campaign.stripe_subscription_id,
          customerEmail: campaign.customer_email,
          returnUrl: window.location.href,
          environment: getStripeEnvironment(),
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed to open portal");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open subscription portal");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-cream font-mono">
      <PaymentTestModeBanner />
      <main className="container mx-auto px-4 py-20 max-w-2xl">
        <div className="rei-surface text-center space-y-6 p-8">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30">
              <Check className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-light text-primary">Subscription active</h1>
          <p className="text-cream/80 text-sm leading-relaxed">
            Your campaign is now active. Rei automatically indexes new tasks and matches them to skill-fit contributors via AskRei and Agent Rei.
          </p>

          {/* Campaign analytics */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-cream/60 text-sm py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting up your campaign... ({pollAttempts}/8)
            </div>
          ) : campaign ? (
            <div className="space-y-4 text-left">
              <div className="rounded-lg border border-cream/10 bg-cream/[0.02] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-cream/40">Campaign</div>
                    <div className="text-sm text-cream truncate">{campaign.project_name}</div>
                    {campaign.project_link && (
                      <a
                        href={campaign.project_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary/80 hover:text-primary inline-flex items-center gap-1 truncate max-w-full"
                      >
                        {campaign.project_link} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">
                    {campaign.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  icon={<ListChecks className="h-4 w-4" />}
                  label="Tasks indexed"
                  value={String(campaign.tasks_imported_count ?? 0)}
                />
                <StatCard
                  icon={<RefreshCw className="h-4 w-4" />}
                  label="Sync cycles"
                  value={String(campaign.scrape_count ?? 0)}
                />
                <StatCard
                  icon={<Calendar className="h-4 w-4" />}
                  label="Renews"
                  value={
                    campaign.expires_at
                      ? new Date(campaign.expires_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"
                  }
                />
              </div>

              {campaign.last_scraped_at && (
                <div className="text-[10px] text-cream/40 text-center">
                  Last sync: {new Date(campaign.last_scraped_at).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-cream/50 py-4">
              Your campaign is being provisioned — check back in a moment.
            </div>
          )}

          {sessionId && (
            <div className="text-[10px] text-cream/40 break-all">Ref: {sessionId}</div>
          )}

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link
              to="/rei"
              className="btn-manga btn-manga-primary px-6 py-3 rounded-full text-sm inline-flex items-center gap-2"
            >
              View on Rei <ExternalLink className="h-4 w-4" />
            </Link>
            {campaign && (
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="btn-manga px-6 py-3 rounded-full text-sm inline-flex items-center gap-2 disabled:opacity-50"
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                Manage subscription
              </button>
            )}
            <Link to="/" className="btn-manga px-6 py-3 rounded-full text-sm">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-cream/10 bg-cream/[0.02] p-3 text-center">
      <div className="flex items-center justify-center text-primary/70 mb-1">{icon}</div>
      <div className="text-lg text-cream font-light">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-cream/40">{label}</div>
    </div>
  );
}
