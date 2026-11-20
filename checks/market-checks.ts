// The Market check the everyday tests make, shared with the bug hunt.
// See checks/trading-checks.ts for why these live outside the specs.

import { expect } from '@playwright/test';
import type { MarketPage } from '../pages/market-page';

/**
 * Types something in the search box and expects exactly those stocks to be
 * left on screen. The search ignores letter case, so "kryl" and "robot" both
 * find Kryl Robotics.
 *
 * Caught by: bug=search, which only matches when the letter case is exact, so
 * anything typed in lower case finds nothing.
 */
export async function expectSearchFindsOnly(
  marketPage: MarketPage,
  typed: string,
  symbols: readonly string[],
): Promise<void> {
  await marketPage.search(typed);

  await expect(
    marketPage.visibleRows(),
    `Searching for "${typed}" should leave ${symbols.length} row(s) on screen.`,
  ).toHaveCount(symbols.length);
  expect(await marketPage.visibleSymbols()).toEqual([...symbols]);
}
