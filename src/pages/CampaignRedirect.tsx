import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function CampaignRedirect() {
  const { code } = useParams<{ code: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!code) {
        setError("Missing campaign code");
        return;
      }
      try {
        const { data, error: invokeErr } = await supabase.functions.invoke(
          "track-campaign-click",
          { body: { shortCode: code, referrer: document.referrer || null } }
        );
        if (cancelled) return;
        if (invokeErr || !data?.redirect) {
          setError(data?.error || invokeErr?.message || "Campaign link unavailable");
          return;
        }
        window.location.replace(data.redirect);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-cream font-mono flex items-center justify-center px-6">
      <div className="text-center space-y-3">
        {!error ? (
          <>
            <div className="text-primary text-sm tracking-widest">{"> redirecting…"}</div>
            <div className="text-cream/40 text-[11px]">Recording click and forwarding you to the campaign.</div>
          </>
        ) : (
          <>
            <div className="text-primary text-sm tracking-widest">{"> error"}</div>
            <div className="text-cream/60 text-[12px]">{error}</div>
            <a href="/" className="text-primary text-[11px] underline">Return home</a>
          </>
        )}
      </div>
    </div>
  );
}
