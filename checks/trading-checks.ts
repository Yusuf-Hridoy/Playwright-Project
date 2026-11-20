// Checks the everyday trading tests make, written once so the bug hunt can
// make the very same check against a broken app.
//
// A check lives here when two tests need it: the normal test that proves it
// passes on a healthy app, and the bug-hunt test that proves it fails on a
// broken one. If only the bug hunt made the check, a green bug hunt would
// prove nothing about the suite that runs every day.
//
// Checks assert. Page objects still do not.

import { expect } from '@playwright/test';
import type { StockPage } from '../pages/stock-page';
import { money } from '../utils/money';

/**
 * Types in a number of shares and reads the total the app quotes back.
 *
 * The total has to be the shares times the price the app is quoting on the
 * same screen, both in the exact data-cents figure and in the money text
 * beside it. Nothing here is a number typed into a test.
 *
 * Caught by: bug=cost, which charges for one share too many from two shares up.
 */
export async function expectBuyTotalIsRight(stockPage: StockPage, shares: number): Promise<void> {
  await stockPage.enterShares(shares);

  const priceCents = await stockPage.summaryPriceCents();
  const costCents = shares * priceCents;

  await expect(
    stockPage.summaryTotal,
    `${shares} shares at ${money(priceCents)} each should cost ${money(costCents)}.`,
  ).toHaveAttribute('data-cents', String(costCents));
  await expect(stockPage.summaryTotal).toHaveText(money(costCents));
}
