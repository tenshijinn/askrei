import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import reiLogo from "@/assets/joinrei/rei-logo.png";

const C = {
  bg: "#0b0b0b",
  card: "#111111",
  line: "rgba(240, 237, 232, 0.08)",
  lineSoft: "rgba(240, 237, 232, 0.05)",
  cream: "#f0ede8",
  peach: "#e8c4b8",
  muted: "#8a857f",
  dim: "#5b5752",
  red: "#ed565a",
};

const SAMPLES = [
  { name: "Ansem", chain: "sol", address: "AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm" },
  { name: "Vitalik", chain: "evm", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
  { name: "Justin Sun", chain: "evm", address: "0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296" },
];

const SUBS: Array<{ key: string; label: string; invert: boolean; weight: number }> = [
  { key: "community", label: "Community", invert: false, weight: 35 },
  { key: "farmer", label: "Farmer", invert: true, weight: 20 },
  { key: "jeet", label: "Jeet", invert: true, weight: 20 },
  { key: "risk", label: "Risk", invert: true, weight: 15 },
  { key: "confidence", label: "Confidence", invert: false, weight: 10 },
];

const SIGNAL_LABELS: Record<string, string> = {
  account_age_days: "Wallet age (days)",
  first_activity_at: "First activity",
  last_activity_at: "Last activity",
  transaction_count: "Transactions",
  swap_count: "Swaps",
  token_count: "Tokens held",
  nft_count: "NFTs held",
  unique_protocols: "Protocols used",
  unique_nft_collections: "NFT collections",
  avg_hold_days: "Avg hold (days)",
  churn_rate: "Churn rate",
  fast_sell_ratio: "Fast-sell ratio",
  reputation_signal: "Reputation",
  risk_signal: "Risk signal",
  sybil_signal: "Sybil signal",
};

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmt = (v: unknown) => {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) return v.length ? `${v.length} · ${v.slice(0, 3).join(", ")}${v.length > 3 ? "…" : ""}` : "—";
  if (typeof v === "number") return v <= 1 && v > 0 && !Number.isInteger(v) ? `${Math.round(v * 100)}%` : v.toLocaleString();
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return String(v);
};

export default function Diamond() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Rei's Diamond Hand Scanner — Score any wallet";
    supabase.functions.invoke("diamond-scan", { body: { peek: true } }).then(({ data }) => {
      if (data?.remaining !== undefined) setRemaining(data.remaining);
    });
  }, []);

  const scan = async (addr = address) => {
    const a = addr.trim();
    if (!a || loading) return;
    setAddress(a);
    setLoading(true);
    setError(null);
    setResult(null);
    const { data, error: err } = await supabase.functions.invoke("diamond-scan", { body: { address: a } });
    setLoading(false);
    let payload = data;
    if (err) {
      try {
        payload = await (err as any).context?.json();
      } catch {
        payload = null;
      }
    }
    if (payload?.remaining !== undefined) setRemaining(payload.remaining);
    if (!payload || payload.error) {
      setError(payload?.message ?? "Scan failed — try again.");
      return;
    }
    setResult(payload);
  };

  const p = result?.profile;
  const out = remaining === 0;

  return (
    <div style={{ background: C.bg, color: C.cream, minHeight: "100vh", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
      <header className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <Link to="/" className="flex items-center gap-2.5">
          <img src={reiLogo} alt="Rei" className="h-6 w-6" />
          <span style={{ fontSize: 11, letterSpacing: "0.2em", color: C.muted }}>DIAMOND HAND</span>
        </Link>
        <Link to="/joinrei" style={{ fontSize: 11, color: C.muted }} className="transition-colors hover:text-[#e8c4b8]">
          For projects →
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-24 md:py-32">
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
          Diamond Hand Score
        </h1>
        <p className="mt-3" style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
          Paste a public Solana or EVM address. Rei reads its history and returns the same score projects use.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            scan();
          }}
          className="mt-10 flex items-center gap-2 pl-4 pr-2 py-2"
          style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10 }}
        >
          <Search size={15} style={{ color: C.dim }} />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Wallet address"
            className="flex-1 bg-transparent py-2.5 outline-none"
            style={{ color: C.cream, fontSize: 13 }}
          />
          {address && (
            <button type="button" onClick={() => setAddress("")} aria-label="Clear" style={{ color: C.dim }} className="hover:text-[#8a857f]">
              <X size={15} />
            </button>
          )}
          <button
            type="submit"
            disabled={loading || out || !address.trim()}
            className="px-4 py-2.5 font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ background: C.peach, color: C.bg, borderRadius: 7, fontSize: 12 }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Scan"}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between" style={{ fontSize: 11, color: C.dim }}>
          <span>Public address only — no wallet connection.</span>
          {remaining !== null && <span style={{ color: out ? C.red : C.dim }}>{remaining} scans left this week</span>}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2" style={{ fontSize: 12 }}>
          <span style={{ color: C.dim }}>Try:</span>
          {SAMPLES.map((s) => (
            <button
              key={s.address}
              onClick={() => scan(s.address)}
              disabled={loading || out}
              className="transition-opacity disabled:opacity-40 hover:opacity-100"
              style={{ color: C.peach, opacity: 0.8 }}
            >
              {s.name}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-16 flex items-center gap-3" style={{ color: C.muted, fontSize: 12 }}>
            <Loader2 className="animate-spin" size={14} /> Reading on-chain history…
          </div>
        )}

        {error && (
          <div className="mt-12" style={{ color: C.red, fontSize: 12 }}>
            {error}
            {out && (
              <>
                {" "}
                <Link to="/rei" className="underline">
                  Join Rei
                </Link>{" "}
                to see your own score.
              </>
            )}
          </div>
        )}

        {p && (
          <section className="mt-16 space-y-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontSize: 56, fontWeight: 600, lineHeight: 1, color: C.peach, letterSpacing: "-0.02em" }}>
                    {p.diamond_score}
                  </span>
                  <span style={{ fontSize: 13, color: C.dim }}>/100</span>
                </div>
                <div className="mt-3" style={{ fontSize: 13, color: C.cream }}>
                  {p.diamond_tier}
                </div>
              </div>
              <div className="text-right" style={{ fontSize: 11, color: C.dim, lineHeight: 1.8 }}>
                <div>{result.chain.toUpperCase()}</div>
                <div>{short(result.address)}</div>
              </div>
            </div>

            <ul className="space-y-1.5" style={{ fontSize: 12, color: C.muted }}>
              {(p.reasons ?? []).slice(0, 3).map((r: string) => (
                <li key={r}>{r}</li>
              ))}
            </ul>

            <div className="space-y-4">
              {SUBS.map((s) => {
                const sub = p.subscores?.[s.key];
                if (!sub) return null;
                const good = s.invert ? 100 - sub.score : sub.score;
                return (
                  <div key={s.key} className="flex items-center gap-4">
                    <span className="w-24 shrink-0" style={{ fontSize: 12, color: C.cream }}>
                      {s.label}
                    </span>
                    <span className="w-10 shrink-0 text-right" style={{ fontSize: 11, color: C.dim }}>
                      {s.weight}%
                    </span>
                    <div className="flex-1 h-px" style={{ background: C.line }}>
                      <div style={{ width: `${good}%`, height: "100%", background: C.peach, opacity: 0.35 + (good / 100) * 0.65 }} />
                    </div>
                    <span className="w-8 shrink-0 text-right" style={{ fontSize: 12, color: C.muted }}>
                      {sub.score}
                    </span>
                  </div>
                );
              })}
            </div>

            <details className="group" style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 14 }}>
              <summary
                className="cursor-pointer list-none transition-colors"
                style={{ fontSize: 11, letterSpacing: "0.14em", color: C.dim }}
              >
                RAW DATAPOINTS
              </summary>
              <dl className="mt-5 grid gap-x-10 gap-y-1.5 sm:grid-cols-2" style={{ fontSize: 11 }}>
                {Object.entries(SIGNAL_LABELS).map(([k, label]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt style={{ color: C.dim }}>{label}</dt>
                    <dd className="text-right truncate" style={{ color: C.muted }}>
                      {fmt(result.signals?.[k])}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4" style={{ fontSize: 11, color: C.dim }}>
                {p.providers_used?.join(" · ") || "no sources responded"} · {p.engine_version}
              </div>
            </details>

            <div className="flex items-center justify-between gap-4" style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 16 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Rewarding only diamond hands?</span>
              <Link to="/joinrei" className="transition-opacity hover:opacity-80" style={{ fontSize: 12, color: C.peach }}>
                Start a campaign →
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
