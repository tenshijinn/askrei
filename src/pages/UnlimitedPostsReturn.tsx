import { useSearchParams, Link } from "react-router-dom";
import { Check, ExternalLink } from "lucide-react";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export default function UnlimitedPostsReturn() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-cream font-mono">
      <PaymentTestModeBanner />
      <main className="container mx-auto px-4 py-20 max-w-xl">
        <div className="rei-surface text-center space-y-6 p-8">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30">
              <Check className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-light text-primary">Subscription active</h1>
          <p className="text-cream/80 text-sm leading-relaxed">
            Rei is now scraping your campaign daily. New tasks will be auto-indexed and matched to skill-fit contributors via AskRei and Agent Rei.
          </p>
          {sessionId && (
            <div className="text-[10px] text-cream/40 break-all">Ref: {sessionId}</div>
          )}
          <div className="flex gap-3 justify-center">
            <Link to="/rei" className="btn-manga btn-manga-primary px-6 py-3 rounded-full text-sm inline-flex items-center gap-2">
              View on Rei <ExternalLink className="h-4 w-4" />
            </Link>
            <Link to="/" className="btn-manga px-6 py-3 rounded-full text-sm">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
