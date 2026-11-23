// The app on a phone. These run in the "mobile" project only, on a Pixel 7.

import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import { boughtTitle, confirmBuyTitle } from '../../data/expected-text';
import { boxOf, pageWidths } from '../../utils/layout';
import { money } from '../../utils/money';

test.describe('Trading on a phone', () => {
  test(
    'logging in and buying one KRYL works at phone size',
    { tag: ['@mobile', '@p3', '@REQ-A11Y-02', '@REQ-TRADE-01'] },
    async ({ loginPage, marketPage, stockPage, topMenu }) => {
      const shares = 1;
      const symbol = 'KRYL';

      await loginPage.goto();
      await loginPage.logIn(TRADER.email, TRADER.password);
      await marketPage.waitUntilReady();

      await marketPage.row(symbol).openTrade();
      await stockPage.waitUntilReady();

      const cashBefore = await topMenu.cashCents();
      await stockPage.enterShares(shares);
      const priceCents = await stockPage.summaryPriceCents();
      const cashAfter = cashBefore - shares * priceCents;

      await stockPage.submit();

      await expect(stockPage.confirmDialog.title).toHaveText(confirmBuyTitle(shares, symbol));

      await stockPage.confirmDialog.confirm();

      await expect(stockPage.successTitle).toHaveText(boughtTitle(shares, symbol));
      await expect(topMenu.cash).toHaveAttribute('data-cents', String(cashAfter));
      await expect(topMenu.cash).toContainText(money(cashAfter));
    },
  );
});

test.describe('Phone layout', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'no page scrolls sideways on a phone',
    { tag: ['@mobile', '@p3', '@REQ-A11Y-02'] },
    async ({
      marketPage,
      stockPage,
      portfolioPage,
      walletPage,
      watchlistPage,
      newsPage,
      profilePage,
      page,
    }) => {
      const openers: readonly [string, () => Promise<void>][] = [
        ['Market', () => marketPage.goto()],
        ['Stock', () => stockPage.goto('KRYL')],
        ['Portfolio', () => portfolioPage.goto()],
        ['Wallet', () => walletPage.goto()],
        ['Watchlist', () => watchlistPage.goto()],
        ['News', () => newsPage.goto()],
        ['Profile', () => profilePage.goto()],
      ];

      for (const [name, open] of openers) {
        await test.step(`the ${name} page fits the screen`, async () => {
          await open();

          const widths = await pageWidths(page);

          expect(
            widths.scrollWidth,
            `The ${name} page is ${widths.scrollWidth}px wide in a ${widths.windowWidth}px window, so it scrolls sideways.`,
          ).toBeLessThanOrEqual(widths.windowWidth);
        });
      }
    },
  );

  test(
    'the alert editor sits under the watchlist, not beside it',
    { tag: ['@mobile', '@p3', '@REQ-A11Y-02'] },
    async ({ watchlistPage }) => {
      await watchlistPage.goto();

      const lastRow = await boxOf(watchlistPage.allRows().last(), 'the last watchlist row');
      const editor = await boxOf(watchlistPage.alertEditor, 'the alert editor');

      expect(
        editor.y,
        'On a phone the alert editor belongs below the list, not in a column beside it.',
      ).toBeGreaterThanOrEqual(lastRow.y + lastRow.height);

      await expect(watchlistPage.alertEditorClosedHint).toBeVisible();
    },
  );
});
