// Public scanner allowance, shared with its UI and boundary tests.
export const DIAMOND_SCAN_LIMIT = 7;
export const DIAMOND_SCAN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function diamondScanUsage(
  usage: { last_asked_at: string; ask_count: number } | null,
  now = Date.now(),
) {
  const active = usage !== null && now - new Date(usage.last_asked_at).getTime() < DIAMOND_SCAN_WINDOW_MS;
  const used = active ? usage.ask_count : 0;
  return { active, used, remaining: Math.max(0, DIAMOND_SCAN_LIMIT - used) };
}