import { describe, expect, it } from "vitest";
import { diamondScanUsage, DIAMOND_SCAN_LIMIT, DIAMOND_SCAN_WINDOW_MS } from "../../supabase/functions/_shared/diamonds/scan-quota";
import { walletKey, rememberScan, type SavedScan } from "@/components/diamond/model";

describe("Diamond scanner allowance", () => {
  const now = Date.UTC(2026, 10, 25, 2, 37);
  const usage = (count: number, timestamp = now) => ({ ask_count: count, last_asked_at: new Date(timestamp).toISOString() });

  it("allows seven scans, including the seventh, and blocks an eighth", () => {
    expect(DIAMOND_SCAN_LIMIT).toBe(7);
    expect(diamondScanUsage(null, now).remaining).toBe(7);
    expect(diamondScanUsage(usage(6), now).remaining).toBe(1);
    expect(diamondScanUsage(usage(7), now).remaining).toBe(0);
    expect(diamondScanUsage(usage(8), now).remaining).toBe(0);
  });

  it("renews seven days after the first scan, not at a calendar-week boundary", () => {
    expect(DIAMOND_SCAN_WINDOW_MS).toBe(604800000);
    const first = now - 604800000;
    expect(diamondScanUsage(usage(7, first + 1), now).remaining).toBe(0);
    expect(diamondScanUsage(usage(7, first), now).remaining).toBe(7);
    expect(diamondScanUsage(usage(7, first), now).active).toBe(false);
  });
});

describe("Real wallet report history", () => {
  it("compares EVM addresses case-insensitively without collapsing distinct Solana addresses", () => {
    expect(walletKey("0xAbC123")).toBe(walletKey("0xabc123"));
    expect(walletKey("AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm")).not.toBe(walletKey("aVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm"));
  });

  it("retains the exact live report and original timestamp when saved", () => {
    const report = { address: "0xAbC123", profile: { diamond_score: 37 }, scannedAt: 123456 } as SavedScan;
    const previous = { address: "0xabc123", profile: { diamond_score: 20 }, scannedAt: 100000 } as SavedScan;
    const history = rememberScan([previous], report);
    expect(history).toHaveLength(1);
    expect(history[0]).toBe(report);
    expect(history[0].profile.diamond_score).toBe(37);
    expect(history[0].scannedAt).toBe(123456);
  });
});