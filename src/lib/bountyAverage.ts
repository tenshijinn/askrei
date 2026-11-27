// Average dollar size of recent bounties, for the home page stat card.
// Only rewards with a direct dollar value count: "$" amounts and dollar-pegged
// stablecoins. Points, quests and unpegged tokens are skipped, not counted as $0.

export const BOUNTY_AVERAGE_WINDOW = 100;

const DOLLAR_PEGGED = new Set(['USD', 'USDC', 'USDT', 'USDG', 'DAI', 'PYUSD', 'BUSD', 'FDUSD', 'USDP']);

export const bountyUsdValue = (compensation: string | null | undefined): number | null => {
  if (!compensation) return null;
  const s = compensation.trim();
  const dollar = s.match(/^\$\s?([\d,]+(?:\.\d+)?)\s?([KkMm])?(?![A-Za-z])/);
  if (dollar) {
    let n = Number(dollar[1].replace(/,/g, ''));
    const suffix = dollar[2]?.toUpperCase();
    if (suffix === 'K') n *= 1_000;
    if (suffix === 'M') n *= 1_000_000;
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const token = s.match(/^([\d,]+(?:\.\d+)?)\s+\$?([A-Za-z][A-Za-z0-9]{1,15})\b/);
  if (token && DOLLAR_PEGGED.has(token[2].toUpperCase())) {
    const n = Number(token[1].replace(/,/g, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
};

export interface BountyAverage {
  average: number | null;
  priced: number;
  total: number;
  highest: number | null;
  lowest: number | null;
}

export const averageBountyUsd = (
  compensations: Array<string | null | undefined>,
  window = BOUNTY_AVERAGE_WINDOW,
): BountyAverage => {
  const sample = compensations.slice(0, window);
  const values = sample.map(bountyUsdValue).filter((v): v is number => v !== null);
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    average: values.length ? sum / values.length : null,
    priced: values.length,
    total: sample.length,
    highest: values.length ? Math.max(...values) : null,
    lowest: values.length ? Math.min(...values) : null,
  };
};

export const formatAverageUsd = (n: number): string =>
  n < 1 ? `$${n.toFixed(2)}` : n >= 100_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${Math.round(n).toLocaleString('en-US')}`;
