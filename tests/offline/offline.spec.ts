// What the app does when the internet goes away and comes back.
//
// The browser is taken offline with context.setOffline(), which is what makes
// the app's own online/offline listeners fire. The "You're back online."
// message closes itself on a three second setTimeout, so the test moves the
// clock rather than waiting.

import { test, expect } from '../../fixtures/test-fixtures';
import { OfflineBanner } from '../../components/offline-banner';
import { Toast } from '../../components/toast';
import { TRADER } from '../../data/demo-accounts';
import { TEXT } from '../../data/expected-text';

/** BACK_ONLINE_MS in js/connection-status.js. */
const BACK_ONLINE_MS = 3_000;

test.describe('Going offline', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'shows the banner and blocks a buy with the offline message',
    {
      tag: ['@regression', '@p2', '@REQ-LIVE-02'],
    },
    async ({ stockPage, context, page }) => {
      const banner = new OfflineBanner(page);

      await stockPage.goto('KRYL');

      await expect(banner.root).toBeHidden();

      await context.setOffline(true);

      await expect(banner.root).toBeVisible();
      await expect(banner.root).toHaveText(TEXT.connection.offlineBanner);

      await test.step('and buying one share gets nowhere', async () => {
        await stockPage.enterShares(1);
        await stockPage.submit();

        await expect(stockPage.error).toHaveText(TEXT.connection.blocked);
        await expect(stockPage.confirmDialog.root).toBeHidden();
        await expect(stockPage.success).toBeHidden();
      });
    },
  );

  test(
    'coming back online hides the banner and says so for three seconds',
    {
      tag: ['@regression', '@p2', '@REQ-LIVE-02'],
    },
    async ({ marketPage, context, page }) => {
      const banner = new OfflineBanner(page);
      const toasts = new Toast(page);

      await marketPage.goto();
      await context.setOffline(true);
      await expect(banner.root).toBeVisible();

      await context.setOffline(false);

      await expect(banner.root).toBeHidden();
      await expect(toasts.all).toHaveCount(1);
      await expect(toasts.all.first()).toContainText(TEXT.connection.backOnline);

      await test.step('and the message closes itself three seconds later', async () => {
        await page.clock.runFor(BACK_ONLINE_MS);

        await expect(toasts.all).toHaveCount(0);
      });
    },
  );
});
