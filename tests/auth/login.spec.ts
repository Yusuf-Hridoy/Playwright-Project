import { test, expect } from '../../fixtures/test-fixtures';
import { DEMO_PASSWORD, NEWBIE, TRADER } from '../../data/demo-accounts';
import { TEXT } from '../../data/expected-text';
import { money } from '../../utils/money';

test.describe('Logging in', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('trader logs in and lands on the market with their cash in the menu', {
    tag: ['@smoke', '@regression'],
  }, async ({ loginPage, marketPage, topMenu }) => {
    await loginPage.logIn(TRADER.email, TRADER.password);

    await marketPage.waitUntilReady();

    await expect(topMenu.cash).toContainText(money(TRADER.start.cashCents));
    await expect(topMenu.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
  });

  test('a wrong password is refused and the log in page stays put', { tag: ['@regression'] }, async ({
    loginPage,
  }) => {
    await loginPage.logIn(TRADER.email, 'Wrong123!');

    await expect(loginPage.error).toHaveText(TEXT.login.wrongPair);
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('empty fields are refused before anything is sent', { tag: ['@regression'] }, async ({ loginPage }) => {
    await loginPage.submitEmpty();

    await expect(loginPage.error).toHaveText(TEXT.login.missingFields);
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('Use fills in a demo account without logging anyone in', { tag: ['@regression'] }, async ({
    loginPage,
  }) => {
    await loginPage.useDemoAccount(NEWBIE.email);

    await expect(loginPage.emailField).toHaveValue(NEWBIE.email);
    await expect(loginPage.passwordField).toHaveValue(DEMO_PASSWORD);
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.error).toBeEmpty();
  });
});
