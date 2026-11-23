import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import {
  boughtDetail,
  boughtTitle,
  confirmBuyTitle,
  marketClosed,
  maxButton,
  notEnoughCash,
  wholeSharesOnly,
} from '../../data/expected-text';
import { money } from '../../utils/money';
import { expectBuyTotalIsRight } from '../../checks/trading-checks';

test.describe('Buying while the market is open', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'buying 5 KRYL takes the same cash in the summary, the message and the menu',
    {
      tag: ['@smoke', '@regression', '@p1', '@REQ-TRADE-01'],
    },
    async ({ stockPage, topMenu }) => {
      const shares = 5;
      await stockPage.goto('KRYL');
      const cashBefore = await topMenu.cashCents();

      await stockPage.enterShares(shares);

      // Everything below is worked out from the price the app is quoting,
      // never from a number typed into the test.
      const priceCents = await stockPage.summaryPriceCents();
      const costCents = shares * priceCents;
      const cashAfter = cashBefore - costCents;

      await test.step('the summary adds up', async () => {
        // The same check the bug hunt makes with bug=cost switched on.
        await expectBuyTotalIsRight(stockPage, shares);
        expect(await stockPage.summaryCashAfterCents()).toBe(cashAfter);
      });

      await test.step('the confirm box quotes the same price', async () => {
        await stockPage.submit();

        await expect(stockPage.confirmDialog.title).toHaveText(confirmBuyTitle(shares, 'KRYL'));
        expect(await stockPage.confirmedPriceCents()).toBe(priceCents);
      });

      await test.step('the trade goes through and the menu agrees', async () => {
        await stockPage.confirmDialog.confirm();

        await expect(stockPage.successTitle).toHaveText(boughtTitle(shares, 'KRYL'));
        await expect(stockPage.successDetail).toHaveText(
          boughtDetail(money(costCents), money(cashAfter)),
        );
        await expect(topMenu.cash).toHaveAttribute('data-cents', String(cashAfter));
        await expect(topMenu.cash).toContainText(money(cashAfter));
      });
    },
  );

  test(
    'a trader with $500 is told the most they can buy',
    { tag: ['@regression', '@p1', '@REQ-TRADE-02'] },
    async ({ accountState, stockPage }) => {
      const cashCents = 50_000;
      await accountState.forUser(TRADER).withCash(cashCents).apply();

      await stockPage.goto('KRYL');
      await accountState.expectApplied();

      const priceCents = await stockPage.summaryPriceCents();
      const affordable = Math.floor(cashCents / priceCents);
      const tooMany = affordable + 1;

      await stockPage.enterShares(tooMany);
      await stockPage.submit();

      await expect(stockPage.error).toHaveText(
        notEnoughCash(tooMany, 'KRYL', money(tooMany * priceCents), money(cashCents), affordable),
      );
      await expect(stockPage.maxButton).toHaveText(maxButton(affordable));
      await expect(stockPage.confirmDialog.root).toBeHidden();
    },
  );

  test(
    'half a share is refused with the whole number rule',
    { tag: ['@regression', '@p1', '@REQ-TRADE-03'] },
    async ({ stockPage }) => {
      await stockPage.goto('KRYL');

      await stockPage.enterShares('2.5');

      await expect(stockPage.error).toHaveText(wholeSharesOnly());

      await stockPage.submit();

      await expect(stockPage.error).toHaveText(wholeSharesOnly());
      await expect(stockPage.confirmDialog.root).toBeHidden();
    },
  );
});

test.describe('Buying with the closed switch on the link', () => {
  test.use({ storageState: TRADER.storageState, marketClosed: true });

  test(
    'a closed market blocks the trade and leaves the cash alone',
    { tag: ['@regression', '@p2', '@REQ-TRADE-05'] },
    async ({ stockPage, topMenu }) => {
      await stockPage.goto('KRYL');

      await expect(stockPage.closedBanner).toBeVisible();
      await expect(stockPage.closedBanner).toHaveText(marketClosed());

      await stockPage.enterShares(1);
      await stockPage.submit();

      await expect(stockPage.error).toHaveText(marketClosed());
      await expect(stockPage.confirmDialog.root).toBeHidden();
      await expect(topMenu.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
    },
  );
});
