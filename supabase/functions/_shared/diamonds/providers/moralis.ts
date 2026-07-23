// Moralis provider — normalizes the four Moralis Solana account endpoints
// already used by analyze-rei-profile into NormalizedSignals.
//
// It accepts the raw Moralis payloads (as the LLM tool loop already fetches
// them) so we don't double the number of Moralis calls per registration.

import type { NormalizedSignals } from "../types.ts";

// Known Solana ecosystem protocol identifiers → clean label.
// Extend freely; the engine only cares about the count/diversity, not the
// literal names. Names are surfaced in "reasons".
const PROTOCOL_HINTS: Record<string, string> = {
  jupiter: "Jupiter",
  raydium: "Raydium",
  orca: "Orca",
  serum: "Serum",
  phoenix: "Phoenix",
  lifinity: "Lifinity",
  meteora: "Meteora",
  saber: "Saber",
  mercurial: "Mercurial",
  marinade: "Marinade",
  lido: "Lido",
  solend: "Solend",
  mango: "Mango",
  drift: "Drift",
  kamino: "Kamino",
  hubble: "Hubble",
  port: "Port",
  tulip: "Tulip",
  francium: "Francium",
};

export interface MoralisRawBundle {
  portfolio?: any;
  swaps?: any;
  tokens?: any;
  nfts?: any;
}

function daysBetween(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now - t) / 86_400_000));
}

function extractProtocols(swaps: any): string[] {
  if (!swaps) return [];
  const rows: any[] = Array.isArray(swaps?.result)
    ? swaps.result
    : Array.isArray(swaps)
      ? swaps
      : [];
  const found = new Set<string>();
  for (const row of rows) {
    const blob = JSON.stringify(row ?? "").toLowerCase();
    for (const [key, label] of Object.entries(PROTOCOL_HINTS)) {
      if (blob.includes(key)) found.add(label);
    }
  }
  return [...found];
}

function extractNftCollections(nfts: any): string[] {
  if (!nfts) return [];
  const rows: any[] = Array.isArray(nfts?.result) ? nfts.result : Array.isArray(nfts) ? nfts : [];
  const set = new Set<string>();
  for (const row of rows) {
    const name = row?.collection?.name ?? row?.collectionName ?? row?.name ?? row?.symbol;
    if (typeof name === "string" && name.trim()) set.add(name.trim());
  }
  return [...set].slice(0, 30);
}

function firstActivityIso(portfolio: any, swaps: any): string | null {
  const candidates: string[] = [];
  const p = portfolio?.firstTransaction ?? portfolio?.first_transaction_at ?? portfolio?.createdAt;
  if (typeof p === "string") candidates.push(p);

  const rows: any[] = Array.isArray(swaps?.result) ? swaps.result : [];
  for (const row of rows) {
    const t = row?.blockTimestamp ?? row?.block_timestamp ?? row?.timestamp;
    if (typeof t === "string") candidates.push(t);
    else if (typeof t === "number") candidates.push(new Date(t * (t < 1e12 ? 1000 : 1)).toISOString());
  }
  if (candidates.length === 0) return null;
  const sorted = candidates
    .map((c) => Date.parse(c))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  return sorted.length ? new Date(sorted[0]).toISOString() : null;
}

function lastActivityIso(swaps: any): string | null {
  const rows: any[] = Array.isArray(swaps?.result) ? swaps.result : [];
  const ts = rows
    .map((r) => r?.blockTimestamp ?? r?.block_timestamp ?? r?.timestamp)
    .map((t) => (typeof t === "number" ? new Date(t * (t < 1e12 ? 1000 : 1)).toISOString() : t))
    .filter((t): t is string => typeof t === "string")
    .map((t) => Date.parse(t))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => b - a);
  return ts.length ? new Date(ts[0]).toISOString() : null;
}

function fastSellRatio(swaps: any): number | null {
  const rows: any[] = Array.isArray(swaps?.result) ? swaps.result : [];
  if (rows.length < 5) return null;
  // Heuristic: swaps flagged as sell with < 24h between two adjacent same-token trades.
  let sells = 0;
  let fast = 0;
  const lastSeen = new Map<string, number>();
  for (const row of rows) {
    const dir = String(row?.transactionType ?? row?.type ?? "").toLowerCase();
    const token = String(row?.tokenAddress ?? row?.token ?? row?.mint ?? "");
    const tsRaw = row?.blockTimestamp ?? row?.block_timestamp ?? row?.timestamp;
    const ts = typeof tsRaw === "number" ? tsRaw * (tsRaw < 1e12 ? 1000 : 1) : Date.parse(tsRaw ?? "");
    if (!token || Number.isNaN(ts)) continue;
    if (dir.includes("sell") || dir.includes("out")) {
      sells++;
      const prev = lastSeen.get(token);
      if (prev && ts - prev < 24 * 3600 * 1000) fast++;
    } else {
      lastSeen.set(token, ts);
    }
  }
  if (sells === 0) return null;
  return Math.min(1, fast / sells);
}

function avgHoldDays(swaps: any): number | null {
  const rows: any[] = Array.isArray(swaps?.result) ? swaps.result : [];
  if (rows.length < 5) return null;
  const holds: number[] = [];
  const openedAt = new Map<string, number>();
  for (const row of rows) {
    const dir = String(row?.transactionType ?? row?.type ?? "").toLowerCase();
    const token = String(row?.tokenAddress ?? row?.token ?? row?.mint ?? "");
    const tsRaw = row?.blockTimestamp ?? row?.block_timestamp ?? row?.timestamp;
    const ts = typeof tsRaw === "number" ? tsRaw * (tsRaw < 1e12 ? 1000 : 1) : Date.parse(tsRaw ?? "");
    if (!token || Number.isNaN(ts)) continue;
    if (dir.includes("buy") || dir.includes("in")) {
      if (!openedAt.has(token)) openedAt.set(token, ts);
    } else if (dir.includes("sell") || dir.includes("out")) {
      const opened = openedAt.get(token);
      if (opened) {
        holds.push((ts - opened) / 86_400_000);
        openedAt.delete(token);
      }
    }
  }
  if (holds.length === 0) return null;
  return holds.reduce((a, b) => a + b, 0) / holds.length;
}

function churnRate(swaps: any, tokens: any): number | null {
  const swapRows: any[] = Array.isArray(swaps?.result) ? swaps.result : [];
  const heldTokens: any[] = Array.isArray(tokens?.result)
    ? tokens.result
    : Array.isArray(tokens)
      ? tokens
      : [];
  if (swapRows.length === 0) return null;
  const heldMints = new Set(
    heldTokens.map((t) => String(t?.mint ?? t?.tokenAddress ?? t?.address ?? "").toLowerCase()).filter(Boolean),
  );
  const swappedMints = new Set(
    swapRows.map((r) => String(r?.tokenAddress ?? r?.token ?? r?.mint ?? "").toLowerCase()).filter(Boolean),
  );
  if (swappedMints.size === 0) return null;
  let flipped = 0;
  for (const m of swappedMints) if (!heldMints.has(m)) flipped++;
  return Math.min(1, flipped / swappedMints.size);
}

export function normalizeMoralis(raw: MoralisRawBundle): NormalizedSignals {
  const swapRows: any[] = Array.isArray(raw.swaps?.result) ? raw.swaps.result : [];
  const tokenRows: any[] = Array.isArray(raw.tokens?.result)
    ? raw.tokens.result
    : Array.isArray(raw.tokens)
      ? raw.tokens
      : [];
  const nftRows: any[] = Array.isArray(raw.nfts?.result)
    ? raw.nfts.result
    : Array.isArray(raw.nfts)
      ? raw.nfts
      : [];

  const first = firstActivityIso(raw.portfolio, raw.swaps);
  const last = lastActivityIso(raw.swaps);

  const anyData =
    !!raw.portfolio || swapRows.length > 0 || tokenRows.length > 0 || nftRows.length > 0;

  return {
    account_age_days: daysBetween(first),
    first_activity_at: first,
    last_activity_at: last,
    transaction_count:
      raw.portfolio?.transactionCount ??
      raw.portfolio?.transaction_count ??
      swapRows.length ??
      null,
    swap_count: swapRows.length || null,
    token_count: tokenRows.length || null,
    nft_count: nftRows.length || null,
    unique_protocols: extractProtocols(raw.swaps),
    unique_nft_collections: extractNftCollections(raw.nfts),
    avg_hold_days: avgHoldDays(raw.swaps),
    churn_rate: churnRate(raw.swaps, raw.tokens),
    fast_sell_ratio: fastSellRatio(raw.swaps),
    reputation_signal: null, // Moralis doesn't provide reputation
    risk_signal: null,
    sybil_signal: null,
    provider: "moralis",
    ok: anyData,
  };
}
