import { test, expect } from '../../fixtures/test-fixtures';
import { Toast } from '../../components/toast';
import { TRADER } from '../../data/demo-accounts';
import {
  TEXT,
  alertHitAt,
  alertPill,
  alertSaved,
  toastDetail,
  toastTitle,
} from '../../data/expected-text';
import { money } from '../../utils/money';

/** The app checks alerts, and closes a pop-up, on five second timers. */
const TICK_MS = 5_000;
/** Long enough for a 0.6% move to carry the price one cent, with room to spare. */
const MOST_TICKS = 120;
const TEN_MINUTES_MS = 10 * 60 * 1_000;

test.describe('Price alerts', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'an alert a cent above the price fires once and clears itself after five seconds',
    {
      tag: ['@regression', '@p2', '@REQ-WATCH-03'],
    },
    async ({ watchlistPage, page }) => {
      const symbol = 'PIXEL';
      const toasts = new Toast(page);
      const row = watchlistPage.row(symbol);

      await watchlistPage.goto();

      const targetCents = await test.step('set an alert a cent above the price', async () => {
        await row.openAlert();

        const priceNowCents = await watchlistPage.alertPriceNowCents();
        const wantedCents = priceNowCents + 1;

        await watchlistPage.saveAlert({
          direction: 'above',
          priceDollars: (wantedCents / 100).toFixed(2),
          popup: true,
        });

        await expect(watchlistPage.alertError).toBeEmpty();
        await expect(watchlistPage.alertMessage).toHaveText(
          alertSaved(symbol, 'above', money(wantedCents)),
        );
        await expect(row.alertStatus).toHaveText(
          alertPill(TEXT.alertEditor.above, money(wantedCents)),
        );

        return wantedCents;
      });

      await test.step('move the clock on until the price crosses it', async () => {
        for (let tick = 0; tick < MOST_TICKS && (await toasts.count()) === 0; tick += 1) {
          await page.clock.runFor(TICK_MS);
        }

        await expect(toasts.bySymbol(symbol)).toBeVisible();
        await expect(toasts.bySymbol(symbol)).toContainText(
          toastTitle(symbol, 'above', money(targetCents)),
        );
        await expect(toasts.bySymbol(symbol)).toContainText(
          toastDetail(money(await row.priceCents())),
        );
        await expect(row.alertStatus).toHaveText(new RegExp(`^${alertHitAt('\\d{2}:\\d{2}')}$`));
      });

      await test.step('the pop-up closes itself five seconds later', async () => {
        await page.clock.runFor(TICK_MS);

        await expect(toasts.bySymbol(symbol)).toBeHidden();
      });

      await test.step('and no second pop-up comes in the next ten minutes', async () => {
        await page.clock.runFor(TEN_MINUTES_MS);

        await expect(toasts.all).toHaveCount(0);
      });
    },
  );
});
