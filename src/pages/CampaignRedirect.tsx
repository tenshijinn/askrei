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
      <div className="text-center space-y-3" style={{ minWidth: 280 }}>
        {!error ? (
          <>
            <div className="text-primary text-sm tracking-widest">{"> redirecting to bounty..."}</div>
            <div
              aria-hidden
              style={{
                fontFamily: "'SF Mono', 'Consolas', monospace",
                fontSize: 13,
                color: "#ed565a",
                letterSpacing: "0.1em",
                userSelect: "none",
              }}
            >
              <span>[</span>
              <span
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  verticalAlign: "bottom",
                  animation: "rei-loadbar 1.4s steps(20, end) infinite",
                  width: "12ch",
                }}
              >
                ████████████████████
              </span>
              <span>]</span>
            </div>
            <style>{`
              @keyframes rei-loadbar {
                0%   { width: 0ch; }
                100% { width: 12ch; }
              }
            `}</style>
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
