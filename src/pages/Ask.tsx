import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Loader2, Lock, UserCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Bounty {
  id: string;
  title: string | null;
  description: string | null;
  company_name: string | null;
  compensation: string | null;
  link: string | null;
  og_image: string | null;
  opportunity_type: string | null;
  role_tags: string[] | null;
}

const Ask = () => {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string>("");
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Ask Rei — rei.chat";
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setSubmitted(true);
    setErrorMsg(null);
    setReply("");
    setBounty(null);

    try {
      const { data, error } = await supabase.functions.invoke("ask-rei-public", {
        body: { query: q },
      });
      if (error) {
        // 429 rate-limited
        const isLimited = (error as any)?.context?.status === 429 || /rate/i.test(error.message ?? "");
        if (isLimited) {
          setErrorMsg("Sign up to continue asking Rei — you get more searches, saved chats, and rewards.");
        } else {
          setErrorMsg("Something went wrong. Please try again shortly.");
        }
      } else {
        setReply(data?.reply ?? "");
        setBounty(data?.bounty ?? null);
      }
    } catch (err: any) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src="/placeholder.svg" alt="rei.chat" className="w-7 h-7 opacity-90" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          <span className="text-sm md:text-base tracking-tight font-medium">rei.chat</span>
        </Link>
        <Link to="/rei">
          <Button variant="secondary" className="rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs md:text-sm h-9 px-4 gap-2">
            Sign up to continue
            <UserCircle2 className="w-4 h-4" />
          </Button>
        </Link>
      </header>

      {/* Main content */}
      <main className={`flex-1 flex flex-col ${submitted ? "" : "items-center justify-center"} px-4 md:px-6`}>
        {!submitted && (
          <div className="w-full max-w-2xl mx-auto text-center pb-40">
            <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center">
              <span className="text-2xl">👁️</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Ask Rei anything.</h1>
            <p className="mt-3 text-white/60">You get 1 free search.</p>
          </div>
        )}

        {submitted && (
          <div className="flex-1 w-full max-w-2xl mx-auto pt-4 pb-40 space-y-6">
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 max-w-[85%] text-sm">
                {query}
              </div>
            </div>

            {/* Assistant reply */}
            <div className="space-y-4">
              {loading && (
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Rei is thinking…
                </div>
              )}

              {!loading && errorMsg && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80">
                  {errorMsg}
                  <div className="mt-3">
                    <Link to="/rei">
                      <Button className="rounded-full bg-white text-black hover:bg-white/90 text-xs h-9 px-4">
                        Sign up free
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {!loading && reply && (
                <p className="text-white/90 leading-relaxed">{reply}</p>
              )}

              {!loading && bounty && (
                <a
                  href={bounty.link ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors overflow-hidden"
                >
                  {bounty.og_image && (
                    <div className="aspect-[16/8] w-full bg-white/5 overflow-hidden">
                      <img src={bounty.og_image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base md:text-lg font-medium leading-tight">{bounty.title}</h3>
                        {bounty.company_name && (
                          <p className="text-xs text-white/50 mt-1">{bounty.company_name}</p>
                        )}
                      </div>
                      {bounty.compensation && (
                        <span className="shrink-0 text-xs rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1">
                          {bounty.compensation}
                        </span>
                      )}
                    </div>
                    {bounty.description && (
                      <p className="mt-3 text-sm text-white/70 line-clamp-3">
                        {bounty.description}
                      </p>
                    )}
                    {bounty.role_tags && bounty.role_tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {bounty.role_tags.slice(0, 4).map((t) => (
                          <span key={t} className="text-[10px] uppercase tracking-wide rounded-full border border-white/10 px-2 py-0.5 text-white/60">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              )}

              {!loading && (reply || bounty) && (
                <div className="pt-2 text-sm text-white/60">
                  Want more? <Link to="/rei" className="underline hover:text-white">Sign up</Link> to keep chatting with Rei.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Composer */}
      <div className={`${submitted ? "fixed" : "absolute"} left-0 right-0 bottom-0 pb-6 pt-4 bg-gradient-to-t from-black via-black/95 to-transparent`}>
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 focus-within:border-white/25 transition-colors">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question or search..."
              disabled={loading}
              className="flex-1 bg-transparent outline-none text-sm md:text-base placeholder:text-white/40 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              aria-label="Ask"
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-40 hover:bg-white/90 transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-white/40 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            <Link to="/rei" className="underline hover:text-white/70">Sign up</Link> to continue chatting, earn points, and unlock all features.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Ask;
