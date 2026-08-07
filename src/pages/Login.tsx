import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Same-origin relative path validator so `next` cannot redirect off-site.
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function Login() {
  const [params] = useSearchParams();
  const next = useMemo(() => safeNext(params.get("next")), [params]);
  const returnUrl = window.location.origin + next;

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If already signed in, hop straight to the redirect target (usually the consent URL).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = returnUrl;
    });
  }, [returnUrl]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: returnUrl },
        });
        if (error) throw error;
        // With auto_confirm_email on, a session is set immediately.
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          window.location.href = returnUrl;
          return;
        }
        setMsg("Check your email to confirm your account, then return here.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = returnUrl;
      }
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-cream flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="max-w-sm w-full rounded-2xl border border-white/10 bg-[#141414] p-8 space-y-4"
      >
        <h1 className="text-2xl font-light text-primary">
          {mode === "signin" ? "Sign in to rei.chat" : "Create a rei.chat account"}
        </h1>
        <p className="text-[11px] font-mono text-cream/50">
          Required to authorize agent (MCP) integrations.
        </p>
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider font-mono text-cream/60">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider font-mono text-cream/60">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </div>
        {msg && <p className="text-xs text-cream/70">{msg}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-primary text-black font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-xs text-cream/60 hover:text-cream"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
