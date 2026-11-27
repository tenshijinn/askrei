import { describe, expect, it } from 'vitest';
import { averageBountyUsd, bountyUsdValue, formatAverageUsd } from '@/lib/bountyAverage';

describe('average bounty size', () => {
  it('counts dollar and stablecoin rewards at face value', () => {
    expect(bountyUsdValue('1,250 USDT')).toBe(1250);
    expect(bountyUsdValue('7.1 USD')).toBe(7.1);
    expect(bountyUsdValue('$1.5K')).toBe(1500);
  });

  it('skips points, quests and unpegged tokens instead of counting them as $0', () => {
    expect(bountyUsdValue(null)).toBeNull();
    expect(bountyUsdValue('10,000 ORDER')).toBeNull();
    expect(bountyUsdValue('500 XUSD')).toBeNull();
    expect(averageBountyUsd(['100 USDC', null, '300 NOS', '50 USDT'])).toEqual({
      average: 75,
      priced: 2,
      total: 4,
    });
  });

  it('only looks at the latest 100 bounties', () => {
    const rows = [...Array(100).fill('10 USDC'), '13,000 USDC'];
    expect(averageBountyUsd(rows)).toEqual({ average: 10, priced: 100, total: 100 });
  });

  it('has no average when nothing is priced', () => {
    expect(averageBountyUsd([null, '300 NOS']).average).toBeNull();
    expect(formatAverageUsd(183.4)).toBe('$183');
  });
});
