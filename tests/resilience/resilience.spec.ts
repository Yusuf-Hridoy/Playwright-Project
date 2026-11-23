// A slow app, and an app that drops the odd request.
//
// Real servers have bad afternoons. A test suite that only passes against a
// fast, healthy server is not telling anyone much. These turn on the app's
// own slow and flaky switches and ask the same questions anyway.
//
// Nothing here waits for a number of seconds. The clock is frozen like
// everywhere else in this suite, and utils/advance-until.ts moves it forward
// a step at a time, which is what a slow app needs: with slow=3000 the second
// load only starts once the first has finished, so one big jump would run
// past the first timer and then sit and wait for a second one that had not
// been made yet.

import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import { STOCK_COUNT } from '../../data/stocks';
import { STOCKS_FAIL_THEN_LOAD_SEED } from '../../data/resilience-seeds';
import { TEXT, boughtTitle, sharesWord } from '../../data/expected-text';
import { MarketPage } from '../../pages/market-page';
import { advanceUntil } from '../../utils/advance-until';
import { freezeClock } from '../../utils/frozen-clock';

/** Three seconds on every single data load the app makes. */
const SLOW_MS = 3_000;

/** Smaller than one load, so no step can jump over the end of one. */
const STEP_MS = 500;

test.describe('An app that takes three seconds over everything', () => {
  test.use({ storageState: TRADER.storageState, slowMs: SLOW_MS });

  test(
    'the Market page shows it is loading, then shows all eight stocks',
    {
      tag: ['@resilience', '@p2', '@REQ-SWITCH-03', '@REQ-MARKET-01'],
    },
    async ({ page, marketPage }) => {
      await marketPage.gotoWhileLoading();

      // The account is loaded before the page is drawn at all, and that load is
      // three seconds slow too, so even the grey loading bars need the clock
      // moving on before they turn up.
      await advanceUntil(page, marketPage.loadingBox, {
        stepMs: STEP_MS,
        what: 'the grey loading bars',
      });
      await expect(marketPage.table).toBeHidden();

      await advanceUntil(page, marketPage.table, { stepMs: STEP_MS, what: 'the stock table' });

      await expect(marketPage.allRows()).toHaveCount(STOCK_COUNT);
      await expect(marketPage.loadingBox).toBeHidden();
      await expect(marketPage.errorBox).toBeHidden();
    },
  );

  test(
    'buying one KRYL still works from end to end',
    { tag: ['@resilience', '@p1', '@REQ-SWITCH-03', '@REQ-TRADE-01'] },
    async ({ page, stockPage, topMenu }) => {
      await stockPage.gotoWhileLoading('KRYL');

      await advanceUntil(page, stockPage.priceOnceLoaded(), {
        stepMs: STEP_MS,
        what: "KRYL's price",
      });

      const cashBefore = await topMenu.cashCents();
      const priceCents = await stockPage.priceCents();

      await stockPage.trade(1);

      await expect(stockPage.successTitle).toHaveText(boughtTitle(1, 'KRYL'));
      await expect(topMenu.cash).toHaveAttribute('data-cents', String(cashBefore - priceCents));
    },
  );

  test(
    "the Portfolio page shows the trader's holdings",
    { tag: ['@resilience', '@p2', '@REQ-SWITCH-03', '@REQ-PORTFOLIO-01'] },
    async ({ page, portfolioPage }) => {
      await portfolioPage.gotoWhileLoading();

      await advanceUntil(page, portfolioPage.row('LUMA'), {
        stepMs: STEP_MS,
        what: 'the LUMA holding row',
      });

      await expect(portfolioPage.allRows()).toHaveCount(Object.keys(TRADER.start.holdings).length);
      await expect(portfolioPage.shares('LUMA')).toHaveText(
        sharesWord(TRADER.start.holdings['LUMA'].shares),
      );
    },
  );
});

test.describe('An app that drops the odd request', () => {
  // The seed is what makes this a test and not a gamble: with it, the stock
  // list fails on the first try every single time. See data/resilience-seeds.ts.
  test.use({
    storageState: TRADER.storageState,
    flaky: true,
    seed: STOCKS_FAIL_THEN_LOAD_SEED,
  });

  test(
    'a load that fails says so, and "Try again" brings the stocks back',
    {
      tag: ['@resilience', '@p2', '@REQ-SWITCH-04', '@REQ-MARKET-04'],
    },
    async ({ page, marketPage }) => {
      await marketPage.gotoWhileLoading();

      await expect(marketPage.errorBox).toBeVisible();
      await expect(marketPage.errorBox).toContainText(TEXT.market.errorTitle);
      await expect(marketPage.table).toBeHidden();

      await marketPage.retry();

      // The second try is let through, but the app still sleeps on it for a
      // while, and that sleep is a timer like any other.
      await advanceUntil(page, marketPage.table, { stepMs: STEP_MS, what: 'the stock table' });

      await expect(marketPage.allRows()).toHaveCount(STOCK_COUNT);
      await expect(marketPage.errorBox).toBeHidden();
    },
  );

  test(
    'the same seed gives the same run of failures on a second page',
    {
      tag: ['@resilience', '@p2', '@REQ-SWITCH-04'],
    },
    async ({ page, marketPage, context, appSwitches, marketTime }) => {
      await marketPage.gotoWhileLoading();
      await expect(marketPage.errorBox).toBeVisible();
      await marketPage.retry();
      await advanceUntil(page, marketPage.table, { stepMs: STEP_MS, what: 'the stock table' });
      await expect(marketPage.allRows()).toHaveCount(STOCK_COUNT);

      await test.step('a second page, opened from scratch, does exactly the same', async () => {
        const second = await context.newPage();
        await freezeClock(second, marketTime);
        const secondMarket = new MarketPage(second, { switches: appSwitches });

        await secondMarket.gotoWhileLoading();

        await expect(secondMarket.errorBox).toBeVisible();
        await expect(secondMarket.table).toBeHidden();

        await secondMarket.retry();
        await advanceUntil(second, secondMarket.table, {
          stepMs: STEP_MS,
          what: 'the stock table on the second page',
        });

        await expect(secondMarket.allRows()).toHaveCount(STOCK_COUNT);
        await second.close();
      });
    },
  );
});
