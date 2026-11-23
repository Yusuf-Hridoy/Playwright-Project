// Doing nothing for fifteen minutes logs you out, with a warning at fourteen.
//
// Every click, key press, wheel turn and scroll counts as activity and puts
// the timer back to zero, so once a page is open these tests touch nothing but
// the clock. They sit on the Rules page, which has no price refresh of its own,
// so moving the clock a quarter of an hour stays cheap.

import { test, expect } from '../../fixtures/test-fixtures';
import { IdleDialog } from '../../components/idle-dialog';
import { TRADER } from '../../data/demo-accounts';
import { TEXT, idleCountdownText } from '../../data/expected-text';

/** WARN_MS in js/idle-timer.js: when the warning comes up. */
const WARN_MS = 14 * 60_000;
/** LOGOUT_MS in js/idle-timer.js: when the session goes. */
const LOGOUT_MS = 15 * 60_000;
/** The countdown starts at 0:59 and counts the last minute down. */
const FIRST_COUNT = 59;

test.describe('The idle log out', () => {
  test.describe('with a session', () => {
    test.use({ storageState: TRADER.storageState });

    test(
      'warns after fourteen minutes, counts down, and "Stay logged in" resets it',
      {
        tag: ['@regression', '@p2', '@REQ-LIVE-03'],
      },
      async ({ rulesPage, page }) => {
        const dialog = new IdleDialog(page);
        const waited = 5_000;

        await rulesPage.goto();

        await expect(dialog.root).toBeHidden();

        await page.clock.runFor(WARN_MS);

        await expect(dialog.root).toBeVisible();
        await expect(dialog.root).toContainText(TEXT.idle.dialogTitle);
        await expect(dialog.countdown).toHaveText(idleCountdownText(FIRST_COUNT));

        await test.step('and the countdown keeps going down', async () => {
          await page.clock.runFor(waited);

          await expect(dialog.countdown).toHaveText(
            idleCountdownText(FIRST_COUNT - waited / 1_000),
          );
        });

        await test.step('"Stay logged in" closes it and starts the fourteen minutes again', async () => {
          await dialog.stayLoggedIn();

          await expect(dialog.root).toBeHidden();

          await page.clock.runFor(WARN_MS - 60_000);

          await expect(dialog.root).toBeHidden();
          await expect(rulesPage.topMenu.root).toBeVisible();

          await page.clock.runFor(60_000);

          await expect(dialog.root).toBeVisible();
          await expect(dialog.countdown).toHaveText(idleCountdownText(FIRST_COUNT));
        });
      },
    );

    test(
      'logs out after fifteen minutes, and the same cash is there on the way back in',
      {
        tag: ['@regression', '@p2', '@REQ-LIVE-03'],
      },
      async ({ rulesPage, loginPage, marketPage, topMenu, page }) => {
        await rulesPage.goto();

        const cashBefore = await topMenu.cashCents();

        await page.clock.runFor(LOGOUT_MS);

        await expect(loginPage.submitButton).toBeVisible();
        await expect(loginPage.infoMessage).toHaveText(TEXT.login.idleInfo);
        await expect(page).toHaveURL(/reason=idle\b/);

        await test.step('logging back in finds the account exactly as it was', async () => {
          await loginPage.logIn(TRADER.email, TRADER.password);

          await marketPage.waitUntilReady();

          await expect(topMenu.cash).toHaveAttribute('data-cents', String(cashBefore));
        });
      },
    );
  });
});
