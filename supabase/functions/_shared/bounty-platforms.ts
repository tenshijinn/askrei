// Display names for the platform slugs found in the aggregated bounty feed.
// Slugs stay as-is in role_tags (used for filtering); only the label changes.
// Unknown slugs fall back to the slug itself so new sources are never hidden.

export const BOUNTY_PLATFORM_LABELS: Record<string, string> = {
  makefun: "make.fun",
  pumpfun: "pump.fun",
};

export function bountyPlatformLabel(slug: string): string {
  const key = slug.trim().toLowerCase();
  return BOUNTY_PLATFORM_LABELS[key] ?? slug.trim();
}
