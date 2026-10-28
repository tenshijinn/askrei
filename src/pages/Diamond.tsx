import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import reiLogo from "@/assets/joinrei/rei-logo.png";

const C = { bg: "#0b0b0b", card: "#131313", line: "#242424", cream: "#f0ede8", peach: "#e8c4b8", muted: "#7a7672", red: "#ed565a" };

const SAMPLES = [
  { name: "Ansem", note: "Solana · tracker-labelled", address: "AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm" },
  { name: "Vitalik Buterin", note: "Ethereum · vitalik.eth", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
  { name: "Justin Sun", note: "Ethereum · public whale", address: "0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296" },
];

const SUBS: Array<{ key: string; label: string; invert: boolean; weight: string; hint: string }> = [
  { key: "community", label: "Community", invert: false, weight: "35%", hint: "Wallet age, protocols used, NFTs, depth" },
  { key: "farmer", label: "Farmer", invert: true, weight: "20%", hint: "Airdrop-farming patterns (lower is better)" },
  { key: "jeet", label: "Jeet", invert: true, weight: "20%", hint: "Fast sells, short holds (lower is better)" },
  { key: "risk", label: "Risk", invert: true, weight: "15%", hint: "Red flags & suspicious activity (lower is better)" },
  { key: "confidence", label: "Confidence", invert: false, weight: "10%", hint: "How much data we could read" },
];

const SIGNAL_LABELS: Record<string, string> = {
  account_age_days: "Wallet age (days)", first_activity_at: "First activity", last_activity_at: "Last activity",
  transaction_count: "Transactions", swap_count: "Swaps", token_count: "Tokens held", nft_count: "NFTs held",
  unique_protocols: "Protocols used", unique_nft_collections: "NFT collections", avg_hold_days: "Avg hold (days)",
  churn_rate: "Churn rate", fast_sell_ratio: "Fast-sell ratio", reputation_signal: "Reputation", risk_signal: "Risk signal", sybil_signal: "Sybil signal",
};

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmt = (v: unknown) => {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) return v.length ? `${v.length} · ${v.slice(0, 4).join(", ")}${v.length > 4 ? "…" : ""}` : "—";
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
    document.title = "Rei's Diamond Scanner — Score any wallet";
    supabase.functions.invoke("diamond-scan", { body: { peek: true } }).then(({ data }) => {
      if (data?.remaining !== undefined) setRemaining(data.remaining);
    });
  }, []);

  const scan = async (addr = address) => {
    const a = addr.trim();
    if (!a || loading) return;
    setAddress(a); setLoading(true); setError(null); setResult(null);
    const { data, error: err } = await supabase.functions.invoke("diamond-scan", { body: { address: a } });
    setLoading(false);
    let payload = data;
    if (err) {
      try { payload = await (err as any).context?.json(); } catch { payload = null; }
    }
    if (payload?.remaining !== undefined) setRemaining(payload.remaining);
    if (!payload || payload.error) { setError(payload?.message ?? "Scan failed — try again."); return; }
    setResult(payload);
  };

  const p = result?.profile;
  const out = remaining === 0;

  return (
    <div style={{ background: C.bg, color: C.cream, minHeight: "100vh", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Link to="/" className="flex items-center gap-3">
          <img src={reiLogo} alt="Rei" className="h-7 w-7" />
          <span style={{ fontSize: 12, letterSpacing: "0.18em", color: C.muted }}>REI / DIAMOND SCANNER</span>
        </Link>
        <Link to="/joinrei" style={{ fontSize: 12, color: C.peach }}>For projects ↗</Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: C.red }}>WALLET BEHAVIOUR ENGINE</div>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold leading-tight">
          Is this wallet a <span style={{ color: C.red }}>diamond hand</span>?
        </h1>
        <p className="mt-4" style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>
          Paste any public Solana or EVM address. Rei cross-references wallet age, holding time, swaps, protocols,
          NFTs and red flags to build a Diamond Score — the same score projects use to target real holders.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); scan(); }} className="mt-8 flex items-center gap-2 p-2"
          style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12 }}>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Wallet address (Solana or 0x…)"
            className="flex-1 bg-transparent px-3 py-3 outline-none" style={{ color: C.cream, fontSize: 14 }} />
          {address && <button type="button" onClick={() => setAddress("")} aria-label="Clear" style={{ color: C.muted }}><X size={16} /></button>}
          <button type="submit" disabled={loading || out || !address.trim()} className="flex items-center gap-2 px-5 py-3 font-semibold disabled:opacity-50"
            style={{ background: C.red, color: C.bg, borderRadius: 8, fontSize: 13 }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Scan wallet
          </button>
        </form>
        <div className="mt-2 flex justify-between" style={{ fontSize: 11, color: C.muted }}>
          <span>Public address only. No wallet connection.</span>
          {remaining !== null && <span style={{ color: out ? C.red : C.muted }}>{remaining}/5 free scans left this week</span>}
        </div>

        <div className="mt-8">
          <div style={{ fontSize: 11, letterSpacing: "0.18em", color: C.muted }}>TRY A FAMOUS WALLET</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {SAMPLES.map((s) => (
              <button key={s.address} onClick={() => scan(s.address)} disabled={loading || out}
                className="text-left p-4 transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10 }}>
                <div className="font-semibold" style={{ fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{s.note}</div>
                <div className="mt-2" style={{ fontSize: 11, color: C.peach }}>{short(s.address)} ↗</div>
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="mt-12 flex items-center gap-3" style={{ color: C.muted, fontSize: 13 }}>
            <Loader2 className="animate-spin" size={16} /> Reading on-chain history… this can take ~20s.
          </div>
        )}
        {error && <div className="mt-10 p-4" style={{ border: `1px solid ${C.red}`, borderRadius: 10, color: C.red, fontSize: 13 }}>
          {error}{out && <> <Link to="/rei" className="underline">Join Rei</Link> to see your own score.</>}
        </div>}

        {p && (
          <section className="mt-12 space-y-6">
            <div className="p-6" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: C.muted }}>
                REPORT · {result.chain.toUpperCase()} · {short(result.address)}
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-6">
                <div>
                  <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, color: C.red }}>{p.diamond_score}<span style={{ fontSize: 20, color: C.muted }}>/100</span></div>
                  <div className="mt-2 font-semibold" style={{ color: C.peach }}>{p.diamond_tier}</div>
                </div>
                <ul className="flex-1 space-y-1" style={{ fontSize: 13, color: C.cream }}>
                  {p.reasons?.map((r: string) => <li key={r}>— {r}</li>)}
                </ul>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {SUBS.map((s) => {
                const sub = p.subscores?.[s.key];
                if (!sub) return null;
                const good = s.invert ? 100 - sub.score : sub.score;
                return (
                  <div key={s.key} className="p-5" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12 }}>
                    <div className="flex justify-between" style={{ fontSize: 12 }}>
                      <span className="font-semibold">{s.label}</span>
                      <span style={{ color: C.muted }}>weight {s.weight}</span>
                    </div>
                    <div className="mt-2" style={{ fontSize: 28, fontWeight: 700 }}>{sub.score}</div>
                    <div className="mt-2 h-1.5 w-full" style={{ background: C.line, borderRadius: 4 }}>
                      <div style={{ width: `${good}%`, height: "100%", background: good >= 60 ? C.peach : C.red, borderRadius: 4 }} />
                    </div>
                    <div className="mt-2" style={{ fontSize: 11, color: C.muted }}>{s.hint}</div>
                    <ul className="mt-3 space-y-1" style={{ fontSize: 12 }}>
                      {sub.reasons?.map((r: string) => <li key={r}>· {r}</li>)}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="p-5" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: C.muted }}>RAW DATAPOINTS CROSS-REFERENCED</div>
              <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2" style={{ fontSize: 12 }}>
                {Object.entries(SIGNAL_LABELS).map(([k, label]) => (
                  <div key={k} className="flex justify-between gap-3" style={{ borderBottom: `1px dashed ${C.line}`, paddingBottom: 4 }}>
                    <dt style={{ color: C.muted }}>{label}</dt>
                    <dd className="text-right truncate">{fmt(result.signals?.[k])}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3" style={{ fontSize: 11, color: C.muted }}>
                Sources: {p.providers_used?.join(", ") || "none responded"} · {p.engine_version}
              </div>
            </div>

            <div className="p-5 flex flex-wrap items-center justify-between gap-4" style={{ border: `1px solid ${C.red}`, borderRadius: 12 }}>
              <span style={{ fontSize: 13 }}>Want to reward only diamond hands in your next campaign?</span>
              <Link to="/joinrei" className="px-4 py-2 font-semibold" style={{ background: C.red, color: C.bg, borderRadius: 8, fontSize: 13 }}>Launch a campaign ↗</Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
