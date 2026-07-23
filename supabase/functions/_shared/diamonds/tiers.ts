// Diamond Score → tier mapping. Keep in sync with docs/reis-diamonds.md.

export const DIAMOND_TIERS = [
  { min: 0, max: 29, label: "Coal", emoji: "🪨" },
  { min: 30, max: 54, label: "Emerald", emoji: "🟢" },
  { min: 55, max: 74, label: "Sapphire", emoji: "🔷" },
  { min: 75, max: 89, label: "Diamond", emoji: "💎" },
  { min: 90, max: 100, label: "Rei's Diamond", emoji: "👑" },
] as const;

export function tierForScore(score: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tier = DIAMOND_TIERS.find((t) => clamped >= t.min && clamped <= t.max);
  return tier?.label ?? "Coal";
}
