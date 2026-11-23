import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';

test.describe('Sessions', () => {
  test(
    'the portfolio asks for a log in first, then opens by itself',
    { tag: ['@regression', '@p1', '@REQ-AUTH-03'] },
    async ({ portfolioPage, loginPage }) => {
      await portfolioPage.gotoExpectingLogin();

      await expect(loginPage.submitButton).toBeVisible();
      await expect(portfolioPage.page).toHaveURL(/next=/);

      await test.step('log in, and the app carries on to where we were going', async () => {
        await loginPage.logIn(TRADER.email, TRADER.password);

        await portfolioPage.waitUntilReady();
        await expect(portfolioPage.page).toHaveURL(/portfolio/);
      });
    },
  );

  test.describe('after logging out', () => {
    test.use({ storageState: TRADER.storageState });

    test(
      'log out returns to the log in page and the market needs a log in again',
      {
        tag: ['@smoke', '@regression', '@p1', '@REQ-AUTH-03'],
      },
      async ({ marketPage, loginPage, topMenu }) => {
        await marketPage.goto();

        await topMenu.logOut();

        await expect(loginPage.submitButton).toBeVisible();

        await test.step('the market is closed to us again', async () => {
          await marketPage.gotoExpectingLogin();

          await expect(loginPage.submitButton).toBeVisible();
          await expect(marketPage.table).toBeHidden();
        });
      },
    );
  });
});
