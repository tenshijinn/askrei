import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
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

const nowTs = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

const Ask = () => {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string>("");
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timestamps, setTimestamps] = useState<{ user: string; assistant: string }>({
    user: "",
    assistant: "",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Ask Rei — rei.chat";
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    const ts = nowTs();
    setLoading(true);
    setSubmitted(true);
    setErrorMsg(null);
    setReply("");
    setBounty(null);
    setTimestamps({ user: ts, assistant: "" });

    try {
      const { data, error } = await supabase.functions.invoke("ask-rei-public", {
        body: { query: q },
      });
      if (error) {
        // 429 rate-limited
        const isLimited =
          (error as any)?.context?.status === 429 || /rate/i.test(error.message ?? "");
        if (isLimited) {
          setErrorMsg(
            "Sign up to continue asking Rei — you get more searches, saved chats, and rewards."
          );
        } else {
          setErrorMsg("Something went wrong. Please try again shortly.");
        }
      } else {
        setReply(data?.reply ?? "");
        setBounty(data?.bounty ?? null);
        setTimestamps((prev) => ({ ...prev, assistant: nowTs() }));
      }
    } catch (err: any) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (variant: "hero" | "fixed") => {
    const isHero = variant === "hero";
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto px-4">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
          style={{
            background: "#141414",
            border: "0.5px solid hsla(18, 52%, 82%, 0.22)",
          }}
        >
          <span
            className="text-xs select-none hidden sm:inline"
            style={{ color: "hsl(18, 52%, 82%)" }}
          >
            @ask &gt;
          </span>
          <input
            ref={isHero ? inputRef : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="type a question or /command..."
            disabled={loading}
            className="flex-1 bg-transparent outline-none disabled:opacity-60 min-w-0"
            style={{
              fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
              fontSize: "13px",
              color: "hsl(30, 10%, 93%)",
              caretColor: "hsl(18, 52%, 82%)",
            }}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            aria-label="Ask"
            className="shrink-0 rounded-md cursor-pointer"
            style={{
              opacity: loading || !query.trim() ? 0.4 : 1,
              background: "transparent",
              border: "0.5px solid hsla(0,0%,100%,0.08)",
              color: "#4a4845",
              fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
              fontSize: "11px",
              padding: "4px 10px",
              letterSpacing: "0.05em",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!loading && query.trim()) {
                e.currentTarget.style.color = "hsl(18, 52%, 82%)";
                e.currentTarget.style.borderColor = "hsla(18, 52%, 82%, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#4a4845";
              e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.08)";
            }}
          >
            {loading ? "..." : "send"}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0a0a0a", color: "hsl(30, 10%, 93%)" }}
    >
      {/* Header — term-bar style */}
      <header
        className="flex items-center justify-between px-5 py-3 md:px-8 shrink-0"
        style={{ background: "#0f0f0f", borderBottom: "0.5px solid hsla(0,0%,100%,0.08)" }}
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: "#2a2826" }} />
              <div className="w-2 h-2 rounded-full" style={{ background: "#2a2826" }} />
              <div className="w-2 h-2 rounded-full" style={{ background: "#2a2826" }} />
            </div>
            <span
              className="text-xs tracking-wide ml-1 hidden sm:inline"
              style={{ color: "#4a4845", letterSpacing: "0.06em" }}
            >
              rei.chat — public ask
            </span>
          </div>
        </Link>
        <Link to="/rei">
          <Button
            variant="ghost"
            className="rounded-full h-9 px-4 text-xs gap-2 hover:opacity-80"
            style={{
              background: "transparent",
              color: "#f0ede8",
              border: "0.5px solid hsla(0,0%,100%,0.18)",
              fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            }}
          >
            sign up
          </Button>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col px-4 md:px-6 relative">
        {!submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center pb-24 -mt-12">
            <div className="w-full max-w-2xl mx-auto text-center">
              <div
                className="mx-auto mb-6 w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "#141414", border: "0.5px solid hsla(0,0%,100%,0.08)" }}
              >
                <span className="text-2xl">👁️</span>
              </div>
              <h1
                className="text-4xl md:text-5xl font-semibold tracking-tight"
                style={{ color: "#f0ede8" }}
              >
                Ask Rei anything.
              </h1>
              <p className="mt-3" style={{ color: "#5c5a57" }}>
                You get 1 free search.
              </p>
              <div className="mt-10">{renderInput("hero")}</div>
            </div>
          </div>
        ) : (
          <div
            className="rei-terminal flex-1 w-full max-w-2xl mx-auto pt-4 pb-40 overflow-y-auto"
            style={{ border: "none", borderRadius: 0, padding: "16px 20px", overflowY: "auto" }}
          >
            {/* User line */}
            <div className="chat-line">
              <span className="chat-ts">[{timestamps.user || nowTs()}]</span>
              <span className="chat-handle handle-user">@you</span>
              <span className="chat-msg">{query}</span>
            </div>

            <div className="line-gap" />
            <div className="term-divider" />
            <div className="line-gap" />

            {/* Assistant reply */}
            <div className="space-y-4">
              {loading && (
                <div className="chat-line">
                  <span className="chat-ts">[...]</span>
                  <span className="chat-handle handle-ai">@rei</span>
                  <span className="chat-msg msg-ai" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Loader2 className="h-3 w-3 animate-spin" style={{ color: "#7a7874" }} />
                    thinking…
                  </span>
                </div>
              )}

              {!loading && errorMsg && (
                <div className="rei-surface-2 p-4 text-sm" style={{ color: "#f0ede8" }}>
                  {errorMsg}
                  <div className="mt-3">
                    <Link to="/rei">
                      <Button
                        className="rounded-full h-9 px-4 text-xs hover:opacity-80"
                        style={{ background: "#f0ede8", color: "#0a0a0a" }}
                      >
                        Sign up free
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {!loading && reply && (
                <div className="chat-line">
                  <span className="chat-ts">[{timestamps.assistant || nowTs()}]</span>
                  <span className="chat-handle handle-ai">@rei</span>
                  <span className="chat-msg msg-ai">{reply}</span>
                </div>
              )}

              {!loading && bounty && (
                <a
                  href={bounty.link ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden transition-colors rei-surface-2 hover:opacity-90"
                >
                  {bounty.og_image && (
                    <div className="aspect-[16/8] w-full overflow-hidden" style={{ background: "#0a0a0a" }}>
                      <img src={bounty.og_image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base md:text-lg font-medium leading-tight" style={{ color: "#f0ede8" }}>
                          {bounty.title}
                        </h3>
                        {bounty.company_name && (
                          <p className="text-xs mt-1" style={{ color: "#5c5a57" }}>
                            {bounty.company_name}
                          </p>
                        )}
                      </div>
                      {bounty.compensation && (
                        <span
                          className="shrink-0 text-xs rounded-full px-2.5 py-1"
                          style={{
                            background: "hsla(18, 52%, 82%, 0.12)",
                            border: "0.5px solid hsla(18, 52%, 82%, 0.22)",
                            color: "hsl(18, 52%, 82%)",
                          }}
                        >
                          {bounty.compensation}
                        </span>
                      )}
                    </div>
                    {bounty.description && (
                      <p className="mt-3 text-sm line-clamp-3" style={{ color: "#a09e9a" }}>
                        {bounty.description}
                      </p>
                    )}
                    {bounty.role_tags && bounty.role_tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {bounty.role_tags.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5"
                            style={{
                              background: "#1e1e1e",
                              border: "0.5px solid hsla(0,0%,100%,0.18)",
                              color: "#a09e9a",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              )}

              {!loading && (reply || bounty) && (
                <p className="pt-2 text-sm" style={{ color: "#5c5a57" }}>
                  Want more?{" "}
                  <Link to="/rei" className="underline hover:opacity-80" style={{ color: "hsl(18, 52%, 82%)" }}>
                    Sign up
                  </Link>{" "}
                  to keep chatting with Rei.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Composer — fixed at bottom only after submission */}
      {submitted && (
        <div
          className="fixed left-0 right-0 bottom-0 z-10"
          style={{
            background: "linear-gradient(to top, #0a0a0a, rgba(10,10,10,0.95), transparent)",
            padding: "16px 0 24px",
            borderTop: "0.5px solid hsla(0,0%,100%,0.08)",
          }}
        >
          {renderInput("fixed")}
          <p
            className="mt-3 text-center text-xs flex items-center justify-center gap-1.5"
            style={{ color: "#4a4845" }}
          >
            <Lock className="w-3 h-3" />
            <Link to="/rei" className="underline hover:opacity-80" style={{ color: "hsl(18, 52%, 82%)" }}>
              Sign up
            </Link>{" "}
            to continue chatting, earn points, and unlock all features.
          </p>
        </div>
      )}

      {/* Footer hint for empty state */}
      {!submitted && (
        <div
          className="absolute left-0 right-0 bottom-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, #0a0a0a, rgba(10,10,10,0.95), transparent)",
            padding: "16px 0 24px",
          }}
        >
          <p
            className="text-center text-xs flex items-center justify-center gap-1.5"
            style={{ color: "#4a4845" }}
          >
            <Lock className="w-3 h-3" />
            <Link
              to="/rei"
              className="underline hover:opacity-80 pointer-events-auto"
              style={{ color: "hsl(18, 52%, 82%)" }}
            >
              Sign up
            </Link>{" "}
            to continue chatting, earn points, and unlock all features.
          </p>
        </div>
      )}
    </div>
  );
};

export default Ask;
