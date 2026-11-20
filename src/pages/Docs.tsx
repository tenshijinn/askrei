import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Moon, Sun, Menu, X, Search, ChevronLeft, ChevronRight } from "lucide-react";

type Block = { h?: string; p?: string; list?: string[]; table?: string[][]; code?: string };
type DocPage = { id: string; group: string; title: string; lead: string; blocks: Block[] };

const PAGES: DocPage[] = [
  { id: "about", group: "Getting started", title: "What is Rei?", lead: "Rei is an AI that finds crypto bounties, airdrops and campaigns for you — and helps projects reward the right people.",
    blocks: [
      { p: "Rei gathers bounties from across the web3 space (task boards, quest platforms, project campaigns) into one place. You ask Rei what you want to earn, and it finds, ranks and explains opportunities that fit you." },
      { h: "Who Rei is for", list: ["Seekers — people who want to earn crypto by completing tasks, bounties and campaigns.", "Projects & companies — teams that want to reach genuine holders and avoid bots and farmers.", "KOLs & referrers — people who share Rei and earn points on the monthly leaderboard."] },
      { h: "The Rei family", list: ["Rei Chatbot — chat with Rei on rei.chat/rei.", "Rei AI Agent — @AskRei_ on X, answering and posting in public.", "Diamond Hand Score — Rei's wallet behaviour engine.", "Earn calculator — see what your bounty earnings could grow into."] },
    ] },
  { id: "how-it-works", group: "Getting started", title: "How it works", lead: "Rei connects three things: bounties, people and wallets.",
    blocks: [
      { list: ["1. Rei collects bounties and campaigns every day and keeps the list fresh.", "2. You sign in with X and connect a Solana or EVM wallet.", "3. Rei reads your wallet history to build your Diamond Hand Score.", "4. You ask Rei for opportunities — it matches bounties to you.", "5. Projects use the score to reward real holders instead of bots."] },
      { h: "Always fresh", p: "Bounties are synced daily. Expired bounties still count towards the lifetime stats you see on the site." },
    ] },
  { id: "quickstart", group: "Getting started", title: "Quick start", lead: "Get from zero to your first bounty in a few minutes.",
    blocks: [
      { list: ["Go to rei.chat/rei and sign up with your X account.", "Connect your Solana wallet, EVM wallet, or both.", "Open the chat and ask something like “show me bounties paying in SOL”.", "Open your Account tab to see your Diamond Hand Score, referrals and points."] },
      { h: "Just want to try?", p: "Visit rei.chat/ask — you can ask Rei one question per week without an account." },
    ] },
  { id: "chatbot", group: "Products", title: "Rei Chatbot", lead: "Your personal bounty assistant inside rei.chat.",
    blocks: [
      { p: "The chatbot understands plain language. Ask about rewards, chains, deadlines or what a campaign needs you to do, and Rei answers with matching bounties and links." },
      { h: "Things to ask", code: "“What bounties end this week?”\n“Find campaigns that pay in USDC.”\n“Explain what this bounty wants me to do.”\n“Which tasks fit a Solana holder?”" },
      { h: "Limits", table: [["Who", "Asks"], ["Signed-in users", "Full chat access"], ["Visitors on /ask", "1 ask per week"]] },
    ] },
  { id: "agent", group: "Products", title: "Rei AI Agent on X", lead: "@AskRei_ is Rei living on X — public, social and always on.",
    blocks: [
      { p: "Mention @AskRei_ in a post or reply with a question about bounties and Rei answers publicly. The agent also shares new opportunities and calls out monthly leaderboard winners." },
      { h: "How to use it", list: ["Follow @AskRei_ on X to see new bounties in your feed.", "Tag @AskRei_ with a question, e.g. “@AskRei_ any SOL bounties today?”.", "Monthly leaderboard winners are confirmed with a public callout or DM from @AskRei_."] },
      { h: "Link", p: "x.com/AskRei_" },
    ] },
  { id: "diamond", group: "Products", title: "Diamond Hand Score", lead: "A 0–100 score showing whether a wallet behaves like a genuine long-term holder.",
    blocks: [
      { p: "Rei reads on-chain history across Solana and EVM chains and turns it into five factors, then combines them into one score." },
      { h: "The five factors", table: [["Factor", "Weight", "What it measures"], ["Community", "35%", "Real participation and long-term holding"], ["Farmer", "20%", "Airdrop-farming patterns (lower is better)"], ["JEET", "20%", "Quick selling right after receiving tokens (lower is better)"], ["Risk", "15%", "Risky activity, including sybil similarity (lower is better)"], ["Confidence", "10%", "How much data Rei had to judge"]] },
      { h: "Formula", code: "score = 0.35×Community + 0.20×(100−Farmer)\n      + 0.20×(100−JEET) + 0.15×(100−Risk)\n      + 0.10×Confidence" },
      { h: "Sybil protection", p: "A sybil attack is one person running many fake wallets to grab more rewards. Rei's Risk factor checks for wallets that look alike and act together, so projects can spot them." },
      { h: "Try it", p: "Projects can scan any wallet at rei.chat/diamond (5 scans per week)." },
    ] },
  { id: "earn", group: "Products", title: "Earn calculator", lead: "See what your bounty earnings could have become if you staked or held them.",
    blocks: [
      { p: "On rei.chat/earn pick a platform (Jito, Marinade, Kamino, marginfi, NLO by L1X) or a token, an amount and a time period. Rei uses real historical prices and yields to show the result." },
      { list: ["Yields are pulled live and refreshed regularly.", "Past months use the yield the platform actually paid when records exist.", "Share your result as an image card on X."] },
    ] },
  { id: "projects", group: "For projects", title: "Launch a campaign", lead: "Reach real holders, not bots.",
    blocks: [
      { list: ["Post an opportunity with PostToRei — a $5 SOL fee applies per submission.", "Target wallets by Diamond Hand Score.", "Track impressions and participants on your campaign.", "Book a call from rei.chat/joinrei for larger campaigns."] },
    ] },
  { id: "referrals", group: "Rewards", title: "Referrals & leaderboard", lead: "Share your link, earn points, climb the monthly top 10.",
    blocks: [
      { h: "Points", table: [["Action by your referral", "Points"], ["Signs up", "25"], ["Buys a package", "100"], ["Books a call", "10"]] },
      { h: "Monthly leaderboard", p: "Points reset every calendar month (UTC). The top 10 are locked on the 1st of each month." },
      { table: [["Rank", "Share of pot"], ["#1", "25%"], ["#2", "15%"], ["#3", "10%"], ["#4–#10", "7.1% each"]] },
      { p: "Find your link and stats in Account → Referrals & Points." },
    ] },
  { id: "account", group: "Help", title: "Account & FAQ", lead: "Common questions.",
    blocks: [
      { h: "Which wallets work?", p: "Solana wallets and EVM wallets (Ethereum and compatible chains)." },
      { h: "Can I delete my account?", p: "Yes — Account → Profile → Delete My Account." },
      { h: "Why is my score low?", p: "New or quiet wallets have less data, which lowers Confidence. Holding longer and joining real communities raises your score over time." },
    ] },
];

export default function Docs() {
  const [params, setParams] = useSearchParams();
  const current = PAGES.find((p) => p.id === params.get("page")) ?? PAGES[0];
  const q = params.get("q") ?? "";
  const [dark, setDark] = useState(() => localStorage.getItem("rei-docs-theme") !== "light");
  const [open, setOpen] = useState(false);
  useEffect(() => { localStorage.setItem("rei-docs-theme", dark ? "dark" : "light"); }, [dark]);
  useEffect(() => { document.title = `${current.title} · Rei Docs`; window.scrollTo(0, 0); }, [current.id]);

  const filtered = useMemo(() => PAGES.filter((p) => !q || (p.title + p.lead + JSON.stringify(p.blocks)).toLowerCase().includes(q.toLowerCase())), [q]);
  const groups = [...new Set(filtered.map((p) => p.group))];
  const idx = PAGES.indexOf(current);
  const go = (id: string) => { const n = new URLSearchParams(params); n.set("page", id); setParams(n); setOpen(false); };

  const t = dark
    ? { bg: "#0b0b0b", side: "#111", fg: "#f0ede8", mute: "#8a8580", line: "#222", acc: "#e8c4b8", card: "#151515" }
    : { bg: "#faf8f5", side: "#f2eee9", fg: "#1a1a1a", mute: "#6b6560", line: "#e3ddd6", acc: "#b5634f", card: "#fff" };

  const nav = (
    <nav className="space-y-6">
      {groups.map((g) => (
        <div key={g}>
          <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: t.mute }}>{g}</div>
          {filtered.filter((p) => p.group === g).map((p) => (
            <button key={p.id} onClick={() => go(p.id)} className="block w-full text-left text-sm px-3 py-1.5 rounded-md"
              style={{ color: p.id === current.id ? t.acc : t.fg, background: p.id === current.id ? t.card : "transparent", borderLeft: `2px solid ${p.id === current.id ? t.acc : "transparent"}` }}>
              {p.title}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen font-mono" style={{ background: t.bg, color: t.fg, cursor: "auto" }}>
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 h-14 border-b" style={{ background: t.bg, borderColor: t.line }}>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={18} /> : <Menu size={18} />}</button>
        <Link to="/" className="font-bold tracking-tight">&gt; REI <span style={{ color: t.mute }} className="font-normal">docs</span></Link>
        <div className="ml-auto flex items-center gap-2 rounded-md px-2 h-8 border w-40 sm:w-64" style={{ borderColor: t.line, background: t.card }}>
          <Search size={14} style={{ color: t.mute }} />
          <input value={q} onChange={(e) => { const n = new URLSearchParams(params); e.target.value ? n.set("q", e.target.value) : n.delete("q"); setParams(n, { replace: true }); }}
            placeholder="Search docs" className="bg-transparent outline-none text-sm w-full" style={{ color: t.fg }} />
        </div>
        <button onClick={() => setDark(!dark)} aria-label="Toggle theme" className="p-2 rounded-md border" style={{ borderColor: t.line }}>
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </header>

      <div className="flex">
        <aside className={`${open ? "block" : "hidden"} md:block fixed md:sticky top-14 z-20 h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r p-5`} style={{ background: t.side, borderColor: t.line }}>
          {nav}
        </aside>

        <main className="flex-1 min-w-0 px-5 md:px-12 py-10">
          <article className="max-w-3xl">
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: t.acc }}>{current.group}</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{current.title}</h1>
            <p className="text-base mb-10" style={{ color: t.mute }}>{current.lead}</p>
            {current.blocks.map((b, i) => (
              <section key={i} className="mb-8 text-[15px] leading-7">
                {b.h && <h2 className="text-lg font-semibold mb-3 pb-2 border-b" style={{ borderColor: t.line }}>{b.h}</h2>}
                {b.p && <p>{b.p}</p>}
                {b.list && <ul className="space-y-2">{b.list.map((l) => <li key={l} className="flex gap-3"><span style={{ color: t.acc }}>›</span><span>{l}</span></li>)}</ul>}
                {b.code && <pre className="rounded-lg p-4 text-sm overflow-x-auto border" style={{ background: t.card, borderColor: t.line }}>{b.code}</pre>}
                {b.table && (
                  <div className="overflow-x-auto rounded-lg border" style={{ borderColor: t.line }}>
                    <table className="w-full text-sm">
                      <thead><tr style={{ background: t.card }}>{b.table[0].map((c) => <th key={c} className="text-left px-4 py-2 font-semibold">{c}</th>)}</tr></thead>
                      <tbody>{b.table.slice(1).map((r, ri) => <tr key={ri} className="border-t" style={{ borderColor: t.line }}>{r.map((c, ci) => <td key={ci} className="px-4 py-2">{c}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
            <div className="mt-14 pt-6 border-t grid grid-cols-2 gap-4" style={{ borderColor: t.line }}>
              <div>{idx > 0 && <button onClick={() => go(PAGES[idx - 1].id)} className="w-full text-left p-4 rounded-lg border" style={{ borderColor: t.line }}><div className="text-xs flex items-center gap-1" style={{ color: t.mute }}><ChevronLeft size={12} />Previous</div>{PAGES[idx - 1].title}</button>}</div>
              <div>{idx < PAGES.length - 1 && <button onClick={() => go(PAGES[idx + 1].id)} className="w-full text-right p-4 rounded-lg border" style={{ borderColor: t.line }}><div className="text-xs flex items-center justify-end gap-1" style={{ color: t.mute }}>Next<ChevronRight size={12} /></div>{PAGES[idx + 1].title}</button>}</div>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
