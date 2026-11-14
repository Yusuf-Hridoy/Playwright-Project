// What the app does when the price list will not load.
//
// Every one of these holds back, breaks or rewrites the one request the app
// makes for its stock list, so the app meets a server that is having a bad day
// without anyone having to break the real one.

import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import { STOCK_COUNT } from '../../data/stocks';
import { TEXT } from '../../data/expected-text';

/** The one request the Market page, the Stock page and the alert checker make. */
const STOCKS_FEED = '**/data/stocks.json';

/** The three grey bars the Market page shows while it waits. */
const LOADING_BARS = 3;

/** A stock list with two companies in it, in the shape js/price-engine.js needs. */
const TWO_STOCKS = [
  {
    symbol: 'NOVA',
    name: 'Nova Energy',
    about: 'Makes solar panels.',
    basePriceCents: 5210,
    stepMaxBps: 30,
    badgeBg: '#2A2410',
    badgeText: '#F5C451',
  },
  {
    symbol: 'KRYL',
    name: 'Kryl Robotics',
    about: 'Makes robot arms for factories.',
    basePriceCents: 14236,
    stepMaxBps: 20,
    badgeBg: '#13243A',
    badgeText: '#A9CEFF',
  },
];

test.describe('When the price list will not load', () => {
  test.use({ storageState: TRADER.storageState });

  test('the Market page says so, and Try again brings the stocks back', {
    tag: ['@network', '@regression'],
  }, async ({ page, marketPage }) => {
    await page.route(STOCKS_FEED, (route) => route.abort());

    await marketPage.gotoWithoutPrices();

    await expect(marketPage.errorBox).toBeVisible();
    await expect(marketPage.errorBox).toContainText(TEXT.market.errorTitle);
    await expect(marketPage.errorBox).toContainText(TEXT.market.errorBody);
    await expect(marketPage.table).toBeHidden();
    await expect(marketPage.loadingBox).toBeHidden();

    await test.step('with the server back, Try again loads all eight rows', async () => {
      await page.unroute(STOCKS_FEED);

      await marketPage.retry();

      await expect(marketPage.errorBox).toBeHidden();
      await expect(marketPage.allRows()).toHaveCount(STOCK_COUNT);
      await marketPage.waitUntilReady();
    });
  });

  test('the Stock page shows the same load error', { tag: ['@network', '@regression'] }, async ({
    page,
    stockPage,
  }) => {
    await page.route(STOCKS_FEED, (route) => route.abort());

    await stockPage.gotoExpectingTrouble('KRYL');

    await expect(stockPage.loadError).toBeVisible();
    await expect(stockPage.loadError).toContainText(TEXT.market.errorTitle);
    await expect(stockPage.retryButton).toBeVisible();
    await expect(stockPage.price).toHaveCount(0);
    await expect(stockPage.notFound).toHaveCount(0);
  });
});

test.describe('While the price list is on its way', () => {
  test.use({ storageState: TRADER.storageState });

  test('the grey loading rows show first, and the real rows take their place', {
    tag: ['@network', '@regression'],
  }, async ({ page, marketPage }) => {
    // The request is held until this test lets it go. A promise, not a timer:
    // the test decides when the server answers, so nothing is left to luck.
    let letItThrough = (): void => {};
    const held = new Promise<void>((resolve) => {
      letItThrough = resolve;
    });

    await page.route(STOCKS_FEED, async (route) => {
      await held;
      await route.continue();
    });

    await marketPage.gotoWhileLoading();

    await expect(marketPage.loadingBox).toBeVisible();
    await expect(marketPage.loadingBars).toHaveCount(LOADING_BARS);
    await expect(marketPage.table).toBeHidden();
    await expect(marketPage.allRows()).toHaveCount(0);

    await test.step('and once the server answers, the stocks arrive', async () => {
      letItThrough();

      await expect(marketPage.loadingBox).toBeHidden();
      await expect(marketPage.allRows()).toHaveCount(STOCK_COUNT);
      await marketPage.waitUntilReady();
    });
  });
});

test.describe('When the server sends a shorter list', () => {
  test.use({ storageState: TRADER.storageState });

  test('the Market page shows exactly the stocks it was sent', {
    tag: ['@network', '@regression'],
  }, async ({ page, marketPage }) => {
    await page.route(STOCKS_FEED, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TWO_STOCKS),
      }),
    );

    await marketPage.goto();

    await expect(marketPage.allRows()).toHaveCount(TWO_STOCKS.length);
    expect(await marketPage.visibleSymbols()).toEqual(TWO_STOCKS.map((stock) => stock.symbol));
    await expect(marketPage.errorBox).toBeHidden();
  });
});
