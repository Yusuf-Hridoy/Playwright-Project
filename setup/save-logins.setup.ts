// Logs in once as each demo account and saves the signed-in session to .auth/.
//
// A spec then starts already logged in:
//   test.use({ storageState: TRADER.storageState });
//
// It carries every tag on purpose. Every other project depends on this one, so
// it has to survive any `--grep`, or the saved sessions would be missing.

import { test as setup, expect } from '../fixtures/test-fixtures';
import { DEMO_ACCOUNTS } from '../data/demo-accounts';
import { money } from '../utils/money';

setup('save a signed-in session for each demo account', { tag: ['@smoke', '@regression', '@a11y', '@visual', '@network', '@mobile'] }, async ({
  page,
  loginPage,
  marketPage,
  topMenu,
}) => {
  for (const account of DEMO_ACCOUNTS) {
    await setup.step(`log in as ${account.displayName}`, async () => {
      await loginPage.goto();
      await loginPage.logIn(account.email, account.password);

      await marketPage.waitUntilReady();
      await expect(topMenu.cash).toContainText(money(account.start.cashCents));

      await page.context().storageState({ path: account.storageState });
      await page.context().clearCookies();
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
    });
  }
});
