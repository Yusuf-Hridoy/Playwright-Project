// spec: specs/REQ-PORTFOLIO-04.md
// seed: tests/seed.spec.ts

import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import { sharesWord } from '../../data/expected-text';
import { centsOf } from '../../utils/money';

/** The KRYL the trader already owns: 5 shares, $703.60 paid in all. */
const FIRST_BUY = TRADER.start.holdings['KRYL'];

/** How many more to buy. Any number does; five keeps the arithmetic readable. */
const MORE_SHARES = 5;

test.describe('Buying the same stock more than once', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'a second buy values KRYL at the average of everything paid for it',
    { tag: ['@regression', '@p1', '@REQ-PORTFOLIO-04'] },
    async ({ accountState, stockPage, portfolioPage, topMenu }) => {
      // Only KRYL, so the Portfolio has one row and one gain to check.
      await accountState.forUser(TRADER).withNoHoldings().withHolding('KRYL', FIRST_BUY).apply();

      await stockPage.goto('KRYL');
      await accountState.expectApplied();

      await test.step('the first buy on its own is the average', async () => {
        await expect(stockPage.factOwned).toHaveText(sharesWord(FIRST_BUY.shares));
        expect(await centsOf(stockPage.factAvgPaid)).toBe(
          Math.round(FIRST_BUY.totalPaidCents / FIRST_BUY.shares),
        );
      });

      // Everything below is worked out from the price the app is quoting.
      await stockPage.enterShares(MORE_SHARES);
      const secondBuyCents = await stockPage.summaryTotalCents();
      const cashBefore = await topMenu.cashCents();

      const sharesNow = FIRST_BUY.shares + MORE_SHARES;
      const paidInAllCents = FIRST_BUY.totalPaidCents + secondBuyCents;

      await stockPage.submit();
      await stockPage.confirmDialog.confirm();
      await expect(stockPage.success).toBeVisible();

      await test.step('the average is the running total over the shares', async () => {
        await expect(stockPage.factOwned).toHaveText(sharesWord(sharesNow));
        expect(await centsOf(stockPage.factAvgPaid)).toBe(Math.round(paidInAllCents / sharesNow));
        await expect(topMenu.cash).toHaveAttribute(
          'data-cents',
          String(cashBefore - secondBuyCents),
        );
      });

      await test.step('the portfolio gain is worth now minus that same total', async () => {
        await portfolioPage.goto();

        await expect(portfolioPage.shares('KRYL')).toHaveText(sharesWord(sharesNow));

        const priceCents = await portfolioPage.priceCents('KRYL');
        const worthCents = await portfolioPage.worthCents('KRYL');

        expect(worthCents, 'the holding is worth its shares times today price').toBe(
          sharesNow * priceCents,
        );
        expect(
          await portfolioPage.gainCents('KRYL'),
          'the gain counts both buys, not just the last price paid',
        ).toBe(worthCents - paidInAllCents);
      });
    },
  );
});
