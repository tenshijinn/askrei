import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ReferralRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trackAndRedirect = async () => {
      if (!code) {
        navigate("/rei", { replace: true });
        return;
      }
      try {
        const sessionId = crypto.randomUUID();
        localStorage.setItem("referral_session_id", sessionId);
        localStorage.setItem("referral_code", code);
        await supabase.functions.invoke("track-referral-click", {
          body: {
            referralCode: code,
            sourceUrl: document.referrer || window.location.href,
            targetPath: "/rei",
          },
        });
        navigate("/rei", { replace: true });
      } catch (err) {
        console.error("Error tracking referral:", err);
        navigate("/rei", { replace: true });
      }
    };
    trackAndRedirect();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default ReferralRedirect;
