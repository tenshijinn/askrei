import { z } from "zod";
export { DIAMOND_SCAN_LIMIT } from "../../../supabase/functions/_shared/diamonds/scan-quota";

export const SAMPLES = [
  { name: "Ansem", address: "AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm" },
  { name: "Vitalik", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
  { name: "Justin Sun", address: "0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296" },
] as const;

const score = z.number().min(0).max(100);
const subscore = z.object({ score, reasons: z.array(z.string()) });
export const scanReportSchema = z.object({
  address: z.string().min(32).max(44),
  chain: z.enum(["solana", "evm"]),
  profile: z.object({
    diamond_score: score,
    diamond_tier: z.string(),
    subscores: z.object({ community: subscore, farmer: subscore, jeet: subscore, risk: subscore, confidence: subscore }),
    reasons: z.array(z.string()),
    providers_used: z.array(z.string()),
    engine_version: z.string(),
  }),
  signals: z.object({
    account_age_days: z.number().nullable(),
    first_activity_at: z.string().nullable(),
    last_activity_at: z.string().nullable(),
    transaction_count: z.number().nullable(),
    swap_count: z.number().nullable(),
    token_count: z.number().nullable(),
    nft_count: z.number().nullable(),
    unique_protocols: z.array(z.string()),
    unique_nft_collections: z.array(z.string()),
    avg_hold_days: z.number().nullable(),
    churn_rate: z.number().nullable(),
    fast_sell_ratio: z.number().nullable(),
    reputation_signal: z.number().nullable(),
    risk_signal: z.number().nullable(),
    sybil_signal: z.number().nullable(),
  }),
  remaining: z.number().min(0),
  limit: z.number().positive(),
});
export const savedScanSchema = scanReportSchema.extend({ scannedAt: z.number().finite().positive() });
export type SavedScan = z.infer<typeof savedScanSchema>;

export const HISTORY_KEY = "rei-diamond-reports-v1";
export const walletKey = (address: string) => /^0x/i.test(address.trim()) ? address.trim().toLowerCase() : address.trim();
export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
export const chainLabel = (chain: SavedScan["chain"]) => chain === "solana" ? "SOL" : "EVM";

export function readHistory(): SavedScan[] {
  try {
    const parsed = z.array(savedScanSchema).safeParse(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"));
    return parsed.success ? parsed.data.slice(0, 8) : [];
  } catch { return []; }
}

export function saveHistory(history: SavedScan[]): boolean {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); return true; }
  catch { return false; }
}

export function rememberScan(history: SavedScan[], report: SavedScan) {
  return [report, ...history.filter((item) => walletKey(item.address) !== walletKey(report.address))].slice(0, 8);
}

export function relativeTime(timestamp: number, now = Date.now()) {
  const seconds = Math.max(0, (now - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export const METRICS = [
  { key: "community", label: "Community", invert: false, weight: 35, tip: "Wallet age, transaction history, DeFi protocols used, NFT collections held and reputation. More established, diverse activity scores higher." },
  { key: "farmer", label: "Farmer", invert: true, weight: 20, tip: "Airdrop-farming patterns: frequent token churn, short holds, repetitive protocol use or heavy trading on a young wallet. Lower is better." },
  { key: "jeet", label: "JEET", invert: true, weight: 20, tip: "Quick-exit behaviour: selling received tokens within 24 hours and average holds under two days. Lower is better." },
  { key: "risk", label: "Risk", invert: true, weight: 15, tip: "Flagged reputation signals, similarity to Sybil clusters, or heavy activity on a brand-new wallet. Missing Sybil data is not a pass. Lower is better." },
  { key: "confidence", label: "Confidence", invert: false, weight: 10, tip: "How much evidence is available: responding sources, sampled transactions and wallet age. Low confidence limits the overall score." },
] as const;

export const SIGNAL_LABELS: Record<keyof SavedScan["signals"], string> = {
  account_age_days: "Wallet age (days)", first_activity_at: "First activity", last_activity_at: "Last activity",
  transaction_count: "Transactions", swap_count: "Swaps", token_count: "Tokens held", nft_count: "NFTs held",
  unique_protocols: "Protocols used", unique_nft_collections: "NFT collections", avg_hold_days: "Avg hold (days)",
  churn_rate: "Churn rate", fast_sell_ratio: "Sold within 24h", reputation_signal: "Reputation signal",
  risk_signal: "Risk signal", sybil_signal: "Sybil signal",
};

export function formatSignal(key: keyof SavedScan["signals"], value: SavedScan["signals"][typeof key]) {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "number") {
    if (["churn_rate", "fast_sell_ratio", "reputation_signal", "risk_signal", "sybil_signal"].includes(key)) return `${Math.round(value * 100)}%`;
    return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value;
}

export function rewardVerdict(score: number) {
  if (score >= 75) return "Strong fit — an established holder to consider for airdrops and bounties.";
  if (score >= 50) return "Good fit — holder-like behaviour makes this wallet a potential reward recipient.";
  if (score >= 25) return "Mixed signals — review the evidence before distributing rewards.";
  return "Limited or concerning signals — review carefully before distributing rewards.";
}

export function sybilVerdict(signal: number | null) {
  if (signal === null) return "Sybil check: no similarity data available for this wallet.";
  if (signal >= 0.5) return "Sybil check: flagged — similarities to farming clusters detected.";
  if (signal >= 0.2) return "Sybil check: some cluster similarity — proceed with care.";
  return "Sybil check: no cluster-similarity patterns detected in available data.";
}