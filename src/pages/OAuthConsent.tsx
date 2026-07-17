import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AuthorizationDetails = {
  client?: { name?: string; client_id?: string; redirect_uris?: string[] };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};

// Local typed view of the beta supabase.auth.oauth namespace.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};

function oauthApi(): OAuthApi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.auth as any).oauth as OAuthApi;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("The authorization server did not return a redirect.");
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-cream flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#141414] p-8">
          <h1 className="text-xl font-light text-primary mb-3">Authorization error</h1>
          <p className="text-sm text-cream/70">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-cream flex items-center justify-center p-6">
        <p className="text-sm text-cream/60 font-mono">Loading…</p>
      </main>
    );
  }

  const clientName = details.client?.name ?? "an app";
  const redirectHost = (() => {
    try {
      return new URL(details.client?.redirect_uris?.[0] ?? "").host;
    } catch {
      return null;
    }
  })();
  const scopes = (details.scope ?? "").split(/\s+/).filter(Boolean);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#141414] p-8 space-y-5">
        <h1 className="text-2xl font-light text-primary">
          Connect {clientName} to rei.chat
        </h1>
        <p className="text-sm text-cream/70">
          This will let {clientName} call rei.chat tools while signed in as you.
        </p>
        {redirectHost && (
          <p className="text-[11px] font-mono text-cream/40">Redirects to: {redirectHost}</p>
        )}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider font-mono text-cream/50">Permissions requested</p>
          <ul className="text-sm text-cream/80 space-y-1">
            {scopes.length === 0 && <li>· Basic account identity</li>}
            {scopes.map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-cream/50">
          This does not bypass rei.chat's permissions or backend policies.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 py-2.5 rounded-lg bg-primary text-black font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 py-2.5 rounded-lg border border-white/15 text-cream hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}
