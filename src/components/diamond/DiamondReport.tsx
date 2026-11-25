import { useEffect, useState } from "react";
import { Activity, ArrowLeft, ArrowLeftRight, Check, ChevronDown, Clock3, Copy, Database, Diamond, Gem, Plus, ShieldAlert, ShieldCheck, Sprout, Users, VenetianMask } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PixelAvatar } from "./PixelAvatar";
import { chainLabel, formatSignal, METRICS, relativeTime, rewardVerdict, SIGNAL_LABELS, shortAddress, sybilVerdict, type SavedScan } from "./model";

function reasonIcon(reason: string) {
  // Presentation only: preserve every explanation from the live scoring engine.
  if (/sybil|cluster similarity/i.test(reason)) return VenetianMask;
  if (/insufficient|limited.*history|sparse.*sample/i.test(reason)) return Clock3;
  if (/^uses\b|protocol|\bdex\b/i.test(reason)) return ArrowLeftRight;
  if (/farmer|farming|churn/i.test(reason)) return Sprout;
  if (/holding|\bhold\b|retention|sell|dump|jeet/i.test(reason)) return Gem;
  if (/confidence|data|provider|source/i.test(reason)) return Database;
  if (/risk|suspicious|reputation|counterpart/i.test(reason)) {
    return /low|clean|healthy|no flagged/i.test(reason) ? ShieldCheck : ShieldAlert;
  }
  if (/active|activity|history|transaction|\btxns\b/i.test(reason)) return Clock3;
  if (/community|nft|collection/i.test(reason)) return Users;
  return Activity;
}

function MetricHelp({ metric }: { metric: typeof METRICS[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" aria-label={`${metric.label} explained`} onClick={(event) => { event.preventDefault(); setOpen(true); }} className="h-auto justify-self-start rounded-none border-b border-dotted border-muted-foreground/50 p-0 text-xs font-normal leading-5 text-foreground hover:bg-transparent hover:text-primary">
          {metric.label}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-[272px] border-border bg-popover p-3.5 text-xs leading-6 text-muted-foreground">
        <span className="mb-1 block text-[10px] text-primary">{metric.label.toUpperCase()} · {metric.weight}%</span>
        {metric.tip}
      </TooltipContent>
    </Tooltip>
  );
}

export function DiamondReport({ report, historySaved, onBack }: { report: SavedScan; historySaved: boolean; onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(report.address); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  };
  const p = report.profile;
  return (
    <div className="diamond-view">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={onBack} className="h-10 border-primary/30 bg-input text-xs font-normal text-primary hover:bg-primary/5 hover:text-primary">
          <ArrowLeft /> scan another address
        </Button>
        <span className="diamond-dim hidden text-[11px] sm:block">scanned {relativeTime(report.scannedAt, now)}</span>
      </div>

      <article className="diamond-frame relative mt-20 px-6 pb-8 pt-9 sm:px-10 sm:pb-9" aria-label="Wallet score report" aria-live="polite">
        <div className="absolute -top-11 right-5 h-[88px] w-[88px] overflow-hidden rounded-full border border-foreground/10 bg-input sm:-top-[62px] sm:right-8 sm:h-[132px] sm:w-[132px]">
          <PixelAvatar address={report.address} className="h-full w-full" />
        </div>
        <h1 className="flex items-center gap-2.5 pr-20 font-mono text-[11px] font-normal text-muted-foreground sm:pr-36">
          <Diamond className="h-4 w-4 shrink-0 text-primary" /> DIAMOND HAND SCORE
        </h1>
        <div className="mt-5 flex flex-wrap items-baseline gap-3 sm:mt-3 sm:pr-36">
          <strong className="diamond-score diamond-ice text-4xl font-bold leading-tight tabular-nums">{p.diamond_score}</strong>
          <span className="text-[13px] text-muted-foreground">/100 · <span className="text-primary">{p.diamond_tier}</span></span>
        </div>
        <p className="mt-3 text-[13px] leading-7 text-muted-foreground">
          Based on this wallet’s holding, selling and farming patterns in available on-chain history.
        </p>

        <div className="mt-7 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex h-8 items-center gap-2 rounded-md border border-foreground/10 bg-input px-3 text-muted-foreground">
            {chainLabel(report.chain)} <span className="text-primary">{shortAddress(report.address)}</span>
          </span>
          {([['Community', p.subscores.community.score], ['Confidence', p.subscores.confidence.score]] as const).map(([label, value]) => (
            <span key={label} className="inline-flex h-8 items-center gap-2 rounded-md border border-foreground/10 bg-input px-3 text-muted-foreground">
              {label} <span className="text-foreground tabular-nums">{value}</span>
            </span>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-flex h-8 cursor-help items-center gap-2 rounded-md border border-foreground/10 bg-input px-3 text-muted-foreground">
                Trust <span className="text-foreground tabular-nums">{100 - p.subscores.risk.score}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-xs leading-6">100 minus Risk. It reflects available evidence, not a guarantee or a completed Sybil check.</TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-8 border-t border-border pt-7">
          <p className="text-[13px] leading-6 text-foreground">{rewardVerdict(p.diamond_score)}</p>
          <p className="diamond-dim mt-1.5 flex items-start gap-2.5 text-[11px] leading-6">
            <VenetianMask aria-hidden="true" className={`mt-[5px] h-3.5 w-3.5 shrink-0 ${report.signals.sybil_signal === null ? "" : report.signals.sybil_signal >= 0.2 ? "text-destructive" : "text-primary/70"}`} />
            <span>{sybilVerdict(report.signals.sybil_signal)}</span>
          </p>
          <ul className="mt-6 space-y-1.5 text-xs leading-6 text-muted-foreground">
            {p.reasons.map((reason) => {
              const ReasonIcon = reasonIcon(reason);
              return <li key={reason} className="flex items-start gap-2.5"><ReasonIcon aria-hidden="true" className="mt-[5px] h-3.5 w-3.5 shrink-0 text-primary/70" /><span>{reason}</span></li>;
            })}
          </ul>

          <div className="mt-8 space-y-5">
            {METRICS.map((metric) => {
              const sub = p.subscores[metric.key];
              const good = metric.invert ? 100 - sub.score : sub.score;
              return (
                <div key={metric.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 sm:grid-cols-[120px_40px_1fr_32px]">
                  <MetricHelp metric={metric} />
                  <span className="diamond-dim hidden text-[11px] sm:block">{metric.weight}%</span>
                  <progress className="diamond-meter col-span-2 col-start-1 row-start-2 sm:col-span-1 sm:col-start-auto sm:row-start-auto" max={100} value={good} aria-label={`${metric.label} contribution`} />
                  <span className="col-start-2 row-start-1 text-right text-xs tabular-nums text-muted-foreground sm:col-start-auto sm:row-start-auto">{sub.score}</span>
                </div>
              );
            })}
          </div>

          <details className="group mt-8 border-t border-border pt-5">
            <summary className="diamond-dim flex cursor-pointer list-none items-center justify-between text-[11px] hover:text-muted-foreground [&::-webkit-details-marker]:hidden">
              RAW DATAPOINTS <Plus className="h-3.5 w-3.5 transition-transform group-open:rotate-45" />
            </summary>
            <dl className="mt-5 space-y-2 text-xs">
              {(Object.keys(SIGNAL_LABELS) as Array<keyof SavedScan["signals"]>).map((key) => (
                <div key={key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 leading-6">
                  <dt className="diamond-dim">{SIGNAL_LABELS[key]}</dt>
                  <dd className="break-words text-right text-muted-foreground">{formatSignal(key, report.signals[key])}</dd>
                </div>
              ))}
            </dl>
            <p className="diamond-dim mt-5 break-words text-[11px] leading-6">{p.providers_used.join(" · ") || "No sources responded"} · {p.engine_version}</p>
            <details className="mt-4 text-[11px] text-muted-foreground">
              <summary className="flex cursor-pointer list-none items-center gap-2">Scoring evidence <ChevronDown className="h-3 w-3" /></summary>
              <dl className="mt-3 space-y-3">
                {METRICS.map((metric) => <div key={metric.key}><dt className="text-primary">{metric.label}</dt><dd className="mt-1 leading-6">{p.subscores[metric.key].reasons.join(" · ")}</dd></div>)}
              </dl>
            </details>
          </details>
        </div>
      </article>
      <div className="diamond-dim mt-3 flex flex-col gap-2 text-[11px] sm:flex-row sm:items-center sm:justify-between">
        <span>{historySaved ? "Saved to recent scans on this device" : "Report available this visit; device storage is unavailable"}</span>
        <Button variant="ghost" onClick={copy} className="h-auto self-start p-0 text-[11px] font-normal text-muted-foreground hover:bg-transparent hover:text-primary">
          {copied ? <Check /> : <Copy />} {copied ? "copied" : "copy address"}
        </Button>
      </div>
      {copyError && <p role="alert" className="mt-2 text-xs text-destructive">Could not copy. <span className="select-all break-all">{report.address}</span></p>}
    </div>
  );
}