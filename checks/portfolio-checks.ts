// The Portfolio checks the everyday tests make, shared with the bug hunt.
// See checks/trading-checks.ts for why these live outside the specs.

import { expect } from '@playwright/test';
import type { PortfolioPage } from '../pages/portfolio-page';
import type { Holding } from '../data/demo-accounts';
import { signedMoney } from '../utils/money';

/**
 * Every holding's gain is what it is worth now less what was paid for it,
 * sign and all: a holding that is up reads as a plus, one that is down reads
 * as a minus.
 *
 * Caught by: bug=gain, which shows every gain with the sign turned round.
 */
export async function expectEachGainIsRight(
  portfolioPage: PortfolioPage,
  holdings: Readonly<Record<string, Holding>>,
): Promise<void> {
  for (const [symbol, holding] of Object.entries(holdings)) {
    const priceCents = await portfolioPage.priceCents(symbol);
    const gainCents = holding.shares * priceCents - holding.totalPaidCents;

    await expect(
      portfolioPage.gain(symbol),
      `${symbol} is worth ${holding.shares} × today's price, less the ${holding.totalPaidCents} cents paid for it.`,
    ).toHaveAttribute('data-cents', String(gainCents));
    await expect(portfolioPage.gain(symbol)).toContainText(signedMoney(gainCents));
  }
}

/**
 * "Sort by gain" puts the biggest gain at the top and works down from there.
 *
 * Caught by: bug=sort, which puts the smallest gain first instead.
 */
export async function expectSortByGainPutsTheBiggestFirst(
  portfolioPage: PortfolioPage,
): Promise<void> {
  await portfolioPage.sortBy('gain');

  const gains = await portfolioPage.gainsInOrder();

  expect(
    new Set(gains).size,
    'Two holdings with the very same gain would read the same either way round, so this check needs holdings that differ.',
  ).toBe(gains.length);

  const biggestFirst = [...gains].sort((left, right) => right - left);
  expect(gains, 'The rows are not in order of gain, biggest first.').toEqual(biggestFirst);
}
