import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, HelpCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import reiLogo from "@/assets/joinrei/rei-logo.png";
import { DiamondReport } from "@/components/diamond/DiamondReport";
import { PixelAvatar } from "@/components/diamond/PixelAvatar";
import { useDiamondScanner } from "@/components/diamond/useDiamondScanner";
import { chainLabel, DIAMOND_SCAN_LIMIT, relativeTime, SAMPLES, shortAddress } from "@/components/diamond/model";

export default function Diamond() {
  const scanner = useDiamondScanner();
  const [now, setNow] = useState(Date.now());
  const out = scanner.remaining === 0;
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <TooltipProvider delayDuration={170}>
      <div className="diamond-page min-h-screen bg-background text-foreground">
        <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Rei home">
            <img src={reiLogo} alt="Rei" className="h-6 w-6" />
            <span className="text-[11px] text-muted-foreground">DIAMOND HAND</span>
          </Link>
          <Button asChild variant="link" className="h-auto p-0 text-[11px] font-normal text-muted-foreground no-underline hover:text-primary hover:no-underline">
            <Link to="/joinrei">For projects <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </header>

        <main className="mx-auto w-full max-w-[860px] px-4 pb-20 pt-12 sm:px-6 sm:pb-32 sm:pt-24">
          {scanner.result ? (
            <DiamondReport key={`${scanner.result.address}-${scanner.result.scannedAt}`} report={scanner.result} historySaved={scanner.historySaved} onBack={scanner.scanAnother} />
          ) : (
            <div className="diamond-view">
              <section className="diamond-frame px-6 pb-7 pt-8 sm:px-10 sm:pb-10 sm:pt-11" aria-label="Wallet scanner">
                <h1 className="text-[28px] leading-tight sm:text-4xl">
                  <span className="font-normal text-primary">Reveal a User’s </span>
                  <span className="diamond-ice font-bold">Diamond Hand Score</span>
                </h1>
                <p className="mt-3 text-[13px] leading-7 text-muted-foreground">
                  Rei AI reads a wallet’s history and reveals JEET or Sybil signals to help you assess bounty and airdrop recipients.
                </p>

                <div className="mt-10 flex items-center gap-2.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" aria-label="About wallet scans" className="hidden shrink-0 border-border bg-input text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start" className="max-w-[272px] text-xs leading-6">
                      Reads public on-chain activity using Rei’s live scoring engine. No wallet connection or signature. Missing evidence is shown, never treated as a clean Sybil check.
                    </TooltipContent>
                  </Tooltip>
                  <form className="flex min-w-0 flex-1 items-center gap-2.5" autoComplete="off" onSubmit={(event) => { event.preventDefault(); void scanner.scan(); }}>
                    <label className="flex h-10 min-w-0 flex-1 cursor-text items-center gap-2 rounded-lg border border-foreground/10 bg-input px-3 transition-colors focus-within:border-primary/40">
                      <span className="shrink-0 text-[13px] text-primary" aria-hidden="true">@rei <span className="diamond-dim hidden sm:inline">&gt;</span></span>
                      <span className="relative flex h-full min-w-0 flex-1 items-center">
                        {!scanner.address && <span className="diamond-caret pointer-events-none absolute left-0 h-4 w-2" aria-hidden="true" />}
                        <input
                          ref={scanner.inputRef}
                          aria-label="Public wallet address"
                          value={scanner.address}
                          onChange={(event) => scanner.changeAddress(event.target.value)}
                          placeholder="paste an address..."
                          spellCheck={false}
                          disabled={scanner.loading}
                          className={`h-full w-full min-w-0 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60 ${scanner.address ? "" : "pl-3.5"}`}
                        />
                      </span>
                      {scanner.address && !scanner.loading && <Button type="button" variant="ghost" aria-label="Clear address" onClick={() => { scanner.changeAddress(""); scanner.inputRef.current?.focus(); }} className="h-6 w-5 shrink-0 p-0 text-muted-foreground hover:bg-transparent hover:text-primary"><X className="h-3 w-3" /></Button>}
                    </label>
                    <Button type="submit" variant="outline" disabled={scanner.loading || scanner.typing || !scanner.address.trim() || (out && !scanner.cachedAddress)} className="h-10 w-[68px] shrink-0 border-primary/30 bg-input px-2 text-xs font-normal text-primary hover:bg-primary/5 hover:text-primary">
                      {scanner.loading ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-label="Scanning" /> : "scan"}
                    </Button>
                  </form>
                </div>

                <div className="diamond-dim mt-3 flex flex-col justify-between gap-2 text-[11px] leading-5 sm:flex-row sm:gap-4" aria-live="polite">
                  <span className={scanner.loading ? "text-primary" : ""}>
                    {scanner.loading ? "Reading on-chain history…" : "Public Solana or EVM address. No wallet connection needed."}
                  </span>
                  <span className={`shrink-0 ${out ? "text-destructive" : ""}`}>
                    {scanner.remaining === null ? `${DIAMOND_SCAN_LIMIT} scans per week` : `${scanner.remaining} / ${DIAMOND_SCAN_LIMIT} scans left this week`}
                  </span>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs">
                  <span className="diamond-dim">Try:</span>
                  {SAMPLES.map((sample) => (
                    <Tooltip key={sample.address}>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="link" disabled={scanner.loading} onClick={() => scanner.typeSample(sample.address)} className="h-auto p-0 text-xs font-normal text-primary/90 no-underline hover:text-primary hover:no-underline">{sample.name}</Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64 text-xs leading-6">
                        {sample.name === "Ansem" ? "Tracker-labelled sample wallet; ownership has been publicly disputed by Ansem." : `${sample.name}’s public sample address.`}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                {scanner.error && <p role="alert" className="mt-6 text-xs leading-6 text-destructive">{scanner.error}</p>}
              </section>

              {scanner.history.length > 0 && (
                <section className="mt-10" aria-label="Recent scans">
                  <div className="flex items-center justify-between px-1 pb-3">
                    <h2 className="font-mono text-[11px] font-normal text-muted-foreground">RECENT SCANS</h2>
                    <Button variant="ghost" onClick={scanner.clearHistory} disabled={scanner.loading} className="h-auto p-0 text-[11px] font-normal text-muted-foreground hover:bg-transparent hover:text-primary">clear</Button>
                  </div>
                  <div className="overflow-hidden rounded-[14px] border border-border bg-card">
                    {scanner.history.map((report) => (
                      <Button key={report.address} variant="ghost" disabled={scanner.loading} onClick={() => scanner.openResult(report)} aria-label={`Open ${shortAddress(report.address)} report`} className="grid h-auto w-full grid-cols-[28px_minmax(0,1fr)_auto_14px] items-center gap-3 whitespace-normal rounded-none border-t border-border px-3.5 py-3.5 text-left text-xs font-normal text-muted-foreground first:border-t-0 hover:bg-muted hover:text-foreground sm:grid-cols-[28px_minmax(0,1fr)_auto_auto_14px] sm:gap-4 sm:px-[18px]">
                        <PixelAvatar address={report.address} className="h-7 w-7 rounded-full" />
                        <span className="min-w-0 truncate text-foreground">{chainLabel(report.chain)} · {shortAddress(report.address)}</span>
                        <span className="whitespace-nowrap text-[11px] sm:text-xs"><span className="tabular-nums text-foreground">{report.profile.diamond_score}</span><span className="hidden sm:inline">/100</span> · <span className="text-primary">{report.profile.diamond_tier}</span></span>
                        <span className="diamond-dim hidden whitespace-nowrap text-[11px] sm:block">{relativeTime(report.scannedAt, now)}</span>
                        <ArrowRight className="diamond-dim h-3.5 w-3.5" />
                      </Button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          <footer className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border px-1 pt-5 text-xs leading-6 text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <p>Scan thousands of wallets at once and know exactly who to distribute to.</p>
            <Button asChild variant="link" className="h-auto shrink-0 p-0 text-xs font-normal text-primary no-underline hover:no-underline hover:opacity-80">
              <Link to="/joinrei">Start a campaign <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}
