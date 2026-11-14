import { test, expect } from '../../fixtures/test-fixtures';
import { Toast } from '../../components/toast';
import { TRADER } from '../../data/demo-accounts';
import {
  TEXT,
  alertAboveError,
  alertBelowError,
  alertRangeError,
  alertSaved,
} from '../../data/expected-text';
import { money } from '../../utils/money';

/** The slider runs from 80% to 120% of the price, from js/watchlist-rules.js. */
const RANGE_LOW_SHARE = 0.8;
const RANGE_HIGH_SHARE = 1.2;

/** The app checks alerts on a five second timer. */
const TICK_MS = 5_000;
const MOST_TICKS = 120;

function lowCents(priceNowCents: number): number {
  return Math.round(priceNowCents * RANGE_LOW_SHARE);
}

function highCents(priceNowCents: number): number {
  return Math.round(priceNowCents * RANGE_HIGH_SHARE);
}

function dollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

interface BadAlert {
  /** The end of the test name, after "the editor refuses ". */
  readonly what: string;
  readonly direction: 'above' | 'below';
  /** Worked out from the price the editor is quoting, never typed by hand. */
  readonly priceDollars: (priceNowCents: number) => string;
  readonly popup: boolean;
  readonly browser: boolean;
  readonly error: (priceNowCents: number) => string;
}

const BAD_ALERTS: readonly BadAlert[] = [
  {
    what: 'a price above the top of the slider',
    direction: 'above',
    priceDollars: (price) => dollars(highCents(price) + 1),
    popup: true,
    browser: false,
    error: (price) => alertRangeError(money(lowCents(price)), money(highCents(price))),
  },
  {
    what: 'an Above alert that is not above the price',
    direction: 'above',
    priceDollars: (price) => dollars(price),
    popup: true,
    browser: false,
    error: (price) => alertAboveError(money(price)),
  },
  {
    what: 'a Below alert that is not below the price',
    direction: 'below',
    priceDollars: (price) => dollars(price),
    popup: true,
    browser: false,
    error: (price) => alertBelowError(money(price)),
  },
  {
    what: 'an alert with no way of telling you',
    direction: 'above',
    priceDollars: (price) => dollars(price + 1),
    popup: false,
    browser: false,
    error: () => TEXT.alertEditor.noChannel,
  },
];

test.describe('What the alert editor refuses', () => {
  test.use({ storageState: TRADER.storageState });

  for (const bad of BAD_ALERTS) {
    test(`the editor refuses ${bad.what}`, { tag: ['@regression'] }, async ({ watchlistPage }) => {
      const symbol = 'PIXEL';
      const row = watchlistPage.row(symbol);

      await watchlistPage.goto();
      await row.openAlert();

      const priceNowCents = await watchlistPage.alertPriceNowCents();

      if (bad.direction === 'above') await watchlistPage.alertAbove.check();
      else await watchlistPage.alertBelow.check();

      await watchlistPage.alertPriceField.fill(bad.priceDollars(priceNowCents));
      if (bad.popup) await watchlistPage.alertPopupCheckbox.check();
      else await watchlistPage.alertPopupCheckbox.uncheck();
      if (bad.browser) await watchlistPage.alertBrowserCheckbox.check();
      else await watchlistPage.alertBrowserCheckbox.uncheck();

      await watchlistPage.alertSaveButton.click();

      await expect(watchlistPage.alertError).toHaveText(bad.error(priceNowCents));
      await expect(watchlistPage.alertMessage).toBeEmpty();
      await expect(row.alertStatus).toHaveText(TEXT.watchlist.noAlert);
    });
  }
});

test.describe('Esc on the watchlist', () => {
  test.use({ storageState: TRADER.storageState });

  test('Esc closes the alert editor and any pop-up that is open', { tag: ['@regression'] }, async ({
    watchlistPage,
    page,
  }) => {
    const firing = 'PIXEL';
    const editing = 'BRISK';
    const toasts = new Toast(page);

    await watchlistPage.goto();

    const targetCents = await test.step('set an alert a cent above the price', async () => {
      await watchlistPage.row(firing).openAlert();
      const priceNowCents = await watchlistPage.alertPriceNowCents();
      const wantedCents = priceNowCents + 1;

      await watchlistPage.saveAlert({
        direction: 'above',
        priceDollars: dollars(wantedCents),
        popup: true,
      });

      await expect(watchlistPage.alertMessage).toHaveText(
        alertSaved(firing, 'above', money(wantedCents)),
      );
      return wantedCents;
    });

    await test.step('let the price cross it, so a pop-up is on screen', async () => {
      for (let tick = 0; tick < MOST_TICKS && (await toasts.count()) === 0; tick += 1) {
        await page.clock.runFor(TICK_MS);
      }
      await expect(toasts.bySymbol(firing)).toBeVisible();
      expect(targetCents).toBeGreaterThan(0);
    });

    await test.step('with the editor open on another stock, Esc clears both', async () => {
      await watchlistPage.row(editing).openAlert();
      await expect(watchlistPage.alertEditorClosedHint).toBeHidden();

      await watchlistPage.pressEscape();

      await expect(watchlistPage.alertEditorClosedHint).toBeVisible();
      await expect(watchlistPage.alertEditorClosedHint).toHaveText(TEXT.alertEditor.closedHint);
      await expect(watchlistPage.alertSaveButton).toBeHidden();
      await expect(toasts.all).toHaveCount(0);
    });
  });
});
