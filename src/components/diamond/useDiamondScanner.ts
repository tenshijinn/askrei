import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { readHistory, rememberScan, saveHistory, scanReportSchema, walletKey, type SavedScan } from "./model";

export function useDiamondScanner() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SavedScan | null>(null);
  const [history, setHistory] = useState(readHistory);
  const [historySaved, setHistorySaved] = useState(true);
  const [remaining, setRemaining] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  const cancelTyping = () => {
    if (typingTimer.current) clearInterval(typingTimer.current);
    typingTimer.current = null;
    setTyping(false);
  };

  useEffect(() => {
    mounted.current = true;
    document.title = "Diamond Hand Score — Rei Wallet Scanner";
    supabase.functions.invoke("diamond-scan", { body: { peek: true } }).then(({ data }) => {
      if (mounted.current && typeof data?.remaining === "number") setRemaining(data.remaining);
    }).catch(() => { /* A failed quota peek must not prevent a real scan. */ });
    return () => {
      mounted.current = false;
      if (typingTimer.current) clearInterval(typingTimer.current);
    };
  }, []);

  const openResult = (report: SavedScan) => {
    setResult(report);
    setError(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const scan = async () => {
    const value = address.trim();
    if (!value || inFlight.current || typing) return;
    const cached = history.find((report) => walletKey(report.address) === walletKey(value));
    if (cached) { openResult(cached); return; }
    if (remaining === 0) { setError("Your seven weekly scans are used. You can still open saved reports below."); return; }
    inFlight.current = true;
    setAddress(value);
    setLoading(true);
    setError(null);
    try {
      const { data, error: requestError } = await supabase.functions.invoke("diamond-scan", { body: { address: value } });
      let payload = data;
      if (requestError) {
        const context = "context" in requestError ? requestError.context : null;
        payload = context instanceof Response ? await context.json().catch(() => null) : null;
      }
      if (!mounted.current) return;
      if (typeof payload?.remaining === "number") setRemaining(payload.remaining);
      const parsed = scanReportSchema.safeParse(payload);
      if (!parsed.success) {
        setError(typeof payload?.message === "string" ? payload.message : "Scan unavailable — please try again shortly.");
        return;
      }
      const report = { ...parsed.data, scannedAt: Date.now() };
      const next = rememberScan(history, report);
      setHistorySaved(saveHistory(next));
      setHistory(next);
      openResult(report);
    } catch {
      if (mounted.current) setError("Could not read this wallet. Please try again shortly.");
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  const typeSample = (value: string) => {
    cancelTyping();
    setError(null);
    inputRef.current?.focus();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setAddress(value); return; }
    setAddress("");
    setTyping(true);
    let index = 0;
    typingTimer.current = setInterval(() => {
      index += 1;
      setAddress(value.slice(0, index));
      if (index >= value.length) cancelTyping();
    }, 14);
  };

  const changeAddress = (value: string) => { cancelTyping(); setAddress(value); setError(null); };
  const scanAnother = () => { cancelTyping(); setResult(null); setAddress(""); setError(null); };
  const clearHistory = () => { setHistorySaved(saveHistory([])); setHistory([]); };
  const cachedAddress = history.some((report) => walletKey(report.address) === walletKey(address));

  return { address, changeAddress, loading, typing, error, result, history, historySaved, remaining, inputRef, scan, typeSample, openResult, scanAnother, clearHistory, cachedAddress };
}