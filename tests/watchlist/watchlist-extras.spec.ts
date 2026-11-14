import { test, expect } from '../../fixtures/test-fixtures';
import { MAX_WATCHLIST, NEWBIE, TRADER } from '../../data/demo-accounts';
import { stockName } from '../../data/stocks';
import {
  TEXT,
  addStarLabel,
  movedMessage,
  removeStarLabel,
  watchlistOption,
} from '../../data/expected-text';

test.describe('Moving rows from the keyboard', () => {
  test.use({ storageState: TRADER.storageState });

  test('ArrowUp on a drag handle moves that row up and keeps the focus on it', {
    tag: ['@regression'],
  }, async ({ watchlistPage }) => {
    const [first, second, third, fourth] = TRADER.watchlistStart.symbols as [
      string,
      string,
      string,
      string,
    ];

    await watchlistPage.goto();
    expect(await watchlistPage.order()).toEqual([first, second, third, fourth]);

    await watchlistPage.row(second).moveUp();

    expect(await watchlistPage.order()).toEqual([second, first, third, fourth]);
    await expect(watchlistPage.statusLine).toHaveText(
      movedMessage(second, 1, TRADER.watchlistStart.symbols.length),
    );
    await expect(watchlistPage.row(second).dragHandle).toBeFocused();
  });
});

test.describe('The / shortcut', () => {
  test.use({ storageState: TRADER.storageState });

  test('/ jumps to the stock picker, and does nothing while a field is being typed in', {
    tag: ['@regression'],
  }, async ({ watchlistPage }) => {
    await watchlistPage.goto();

    await watchlistPage.pressSlash();

    await expect(watchlistPage.addSelect).toBeFocused();

    await test.step('inside the alert price field the key is just a key', async () => {
      await watchlistPage.row('NOVA').openAlert();
      await watchlistPage.alertPriceField.click();

      await watchlistPage.pressSlash();

      await expect(watchlistPage.alertPriceField).toBeFocused();
      await expect(watchlistPage.addSelect).not.toBeFocused();
    });
  });
});

test.describe('Remove all', () => {
  test.use({ storageState: TRADER.storageState });

  test('the browser asks first: saying no keeps the list, saying yes empties it', {
    tag: ['@regression'],
  }, async ({ watchlistPage, page }) => {
    const saved = TRADER.watchlistStart.symbols;

    await watchlistPage.goto();
    expect(await watchlistPage.order()).toEqual(saved);

    const firstQuestion = new Promise<string>((resolve) => {
      page.once('dialog', (dialog) => {
        resolve(dialog.message());
        void dialog.dismiss();
      });
    });

    await watchlistPage.pressRemoveAll();

    expect(await firstQuestion).toBe(TEXT.watchlist.removeAllConfirm);
    await expect(watchlistPage.allRows()).toHaveCount(saved.length);
    expect(await watchlistPage.order()).toEqual(saved);

    await test.step('saying yes empties the list', async () => {
      const secondQuestion = new Promise<string>((resolve) => {
        page.once('dialog', (dialog) => {
          resolve(dialog.message());
          void dialog.accept();
        });
      });

      await watchlistPage.pressRemoveAll();

      expect(await secondQuestion).toBe(TEXT.watchlist.removeAllConfirm);
      await expect(watchlistPage.allRows()).toHaveCount(0);
      await expect(watchlistPage.emptyMessage).toBeVisible();
      await expect(watchlistPage.emptyMessage).toContainText(TEXT.watchlist.emptyTitle);
    });
  });
});

test.describe('A full watchlist', () => {
  test.use({ storageState: TRADER.storageState });

  test('a seventh stock is refused, and the list stays at six', { tag: ['@regression'] }, async ({
    accountState,
    watchlistPage,
  }) => {
    const full = ['NOVA', 'PIXEL', 'BRISK', 'OAKFIN', 'KRYL', 'LUMA'];
    const oneTooMany = 'TERRA';

    await accountState.forUser(TRADER).withWatchlist(full).apply();

    await watchlistPage.goto();
    await accountState.expectApplied();
    await expect(watchlistPage.allRows()).toHaveCount(MAX_WATCHLIST);

    await watchlistPage.addStock(oneTooMany);

    await expect(watchlistPage.addError).toHaveText(TEXT.watchlist.full);
    await expect(watchlistPage.allRows()).toHaveCount(MAX_WATCHLIST);
    expect(await watchlistPage.order()).toEqual(full);

    await test.step('the stock is still in the picker, waiting for room', async () => {
      await expect(watchlistPage.addSelect).toHaveValue(oneTooMany);
      await expect(watchlistPage.addSelect).toContainText(
        watchlistOption(oneTooMany, stockName(oneTooMany)),
      );
    });
  });
});

test.describe('The star on the Market page', () => {
  test.use({ storageState: NEWBIE.storageState });

  test('the star turns on, renames itself, and the Watchlist agrees after a reload', {
    tag: ['@regression'],
  }, async ({ marketPage, watchlistPage }) => {
    const symbol = 'KRYL';
    const star = marketPage.row(symbol).watchStar;

    await marketPage.goto();

    await expect(star).toHaveAttribute('aria-pressed', 'false');
    await expect(star).toHaveAccessibleName(addStarLabel(symbol));
    await expect(star).toHaveText(TEXT.watchlist.starOff);

    await marketPage.row(symbol).toggleWatch();

    await expect(star).toHaveAttribute('aria-pressed', 'true');
    await expect(star).toHaveAccessibleName(removeStarLabel(symbol));
    await expect(star).toHaveText(TEXT.watchlist.starOn);

    await test.step('the Watchlist page lists it', async () => {
      await watchlistPage.goto();

      expect(await watchlistPage.order()).toEqual([symbol]);
      await expect(watchlistPage.row(symbol).alertStatus).toHaveText(TEXT.watchlist.noAlert);
    });
  });
});

test.describe('Browser alerts, with permission', () => {
  test.use({ storageState: TRADER.storageState });

  // The hint inside the alert editor is not checked here. A headless Chromium
  // cannot show notifications at all, so Notification.permission reads "denied"
  // even once the permission is granted, and the hint keeps showing. The button
  // uses what requestPermission() answers, which is "granted", so that is what
  // this test is about. The denied case is covered by its own test below.
  test('turning them on says they are on', { tag: ['@regression'] }, async ({
    context,
    watchlistPage,
  }) => {
    await context.grantPermissions(['notifications']);

    await watchlistPage.goto();

    await watchlistPage.turnOnBrowserAlerts();

    await expect(watchlistPage.browserAlertsStatus).toHaveText(TEXT.browserAlerts.granted);
  });
});

test.describe('Browser alerts, without permission', () => {
  test.use({ storageState: TRADER.storageState });

  test('the status line says the browser blocked them and the editor says to turn them on', {
    tag: ['@regression'],
  }, async ({ watchlistPage }) => {
    await watchlistPage.goto();

    await expect(watchlistPage.browserAlertsStatus).toHaveText(TEXT.browserAlerts.denied);

    await watchlistPage.row('NOVA').openAlert();

    await expect(watchlistPage.alertBrowserHint).toBeVisible();
    await expect(watchlistPage.alertBrowserHint).toHaveText(TEXT.alertEditor.browserHint);
    await expect(watchlistPage.alertBrowserCheckbox).not.toBeChecked();
  });
});
