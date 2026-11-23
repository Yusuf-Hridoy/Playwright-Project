import { test, expect } from '../../fixtures/test-fixtures';
import { NEWBIE, TRADER } from '../../data/demo-accounts';
import { STOCKS, SYMBOLS, STOCK_COUNT } from '../../data/stocks';
import { TEXT, marketClosed, sharesWord } from '../../data/expected-text';
import { expectSearchFindsOnly } from '../../checks/market-checks';

test.describe('The market, seen by someone who owns stocks', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'lists all eight stocks and the shares the trader owns',
    { tag: ['@smoke', '@regression', '@p2', '@REQ-MARKET-01'] },
    async ({ marketPage }) => {
      await marketPage.goto();

      await expect(marketPage.allRows()).toHaveCount(STOCK_COUNT);
      expect(await marketPage.visibleSymbols()).toEqual([...SYMBOLS]);

      for (const [symbol, holding] of Object.entries(TRADER.start.holdings)) {
        await expect(marketPage.row(symbol).owned).toHaveText(sharesWord(holding.shares));
      }

      const ownsNothing = SYMBOLS.filter((symbol) => !(symbol in TRADER.start.holdings));
      for (const symbol of ownsNothing) {
        await expect(marketPage.row(symbol).owned).toHaveText(TEXT.market.noneOwned);
      }
    },
  );

  test(
    'searching for "robot" leaves only Kryl Robotics',
    { tag: ['@regression', '@p2', '@REQ-MARKET-02'] },
    async ({ marketPage }) => {
      await marketPage.goto();

      // The same check the bug hunt makes with bug=search switched on, which
      // only matches when the letter case is exact.
      await expectSearchFindsOnly(marketPage, 'robot', ['KRYL']);
    },
  );

  test(
    'the same seed and the same time give the same prices after a reload',
    { tag: ['@regression', '@p2', '@REQ-MARKET-03'] },
    async ({ marketPage, page }) => {
      await marketPage.goto();
      const before: number[] = [];
      for (const stock of STOCKS) before.push(await marketPage.row(stock.symbol).priceCents());

      await page.reload();
      await marketPage.waitUntilReady();

      const after: number[] = [];
      for (const stock of STOCKS) after.push(await marketPage.row(stock.symbol).priceCents());
      expect(after).toEqual(before);
    },
  );
});

test.describe('The market, seen by someone who owns nothing', () => {
  test.use({ storageState: NEWBIE.storageState });

  test(
    'the "I own" filter says there is nothing to show',
    { tag: ['@regression', '@p2', '@REQ-MARKET-02'] },
    async ({ marketPage }) => {
      await marketPage.goto();

      await marketPage.showOnlyOwned();

      await expect(marketPage.emptyMessage).toBeVisible();
      await expect(marketPage.emptyMessage).toContainText(TEXT.market.emptyOwned);
      await expect(marketPage.visibleRows()).toHaveCount(0);
    },
  );
});

test.describe('The market with the closed switch on the link', () => {
  test.use({ storageState: TRADER.storageState, marketClosed: true });

  test(
    'a closed market says so in the banner and in the menu',
    { tag: ['@regression', '@p2', '@REQ-TRADE-05'] },
    async ({ marketPage, topMenu }) => {
      await marketPage.goto();

      await expect(marketPage.closedBanner).toBeVisible();
      await expect(marketPage.closedBanner).toHaveText(marketClosed());
      await expect(topMenu.marketStatus).toHaveText(TEXT.menu.marketClosed);
    },
  );
});
