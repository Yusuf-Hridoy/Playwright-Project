// One accessibility pass per page. A page fails on any serious or critical
// problem, and the failure prints the rule, how bad it is and every element it
// was found on.
//
// A real problem is never hidden. It goes in data/a11y-known-issues.ts with
// the page, the rule and one sentence saying why, and only that one rule is
// left out on that one page. That list is empty today.

import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import { reportFor, scanPage } from '../../utils/a11y';

test.describe('The log in page', () => {
  test('has no serious accessibility problems', { tag: ['@a11y', '@regression'] }, async ({
    loginPage,
    page,
  }) => {
    await loginPage.goto();
    // Axe leans on its own timers, and every test starts with the clock
    // frozen, so the clock is let go before the scan.
    await page.clock.resume();

    const report = await scanPage(page, 'login');

    expect(report.blocking, reportFor(report)).toEqual([]);
  });
});

test.describe('Every signed-in page', () => {
  test.use({ storageState: TRADER.storageState });

  test('the Market page has no serious accessibility problems', {
    tag: ['@a11y', '@regression'],
  }, async ({ marketPage, page }) => {
    await marketPage.goto();
    await page.clock.resume();

    const report = await scanPage(page, 'market');

    expect(report.blocking, reportFor(report)).toEqual([]);
  });

  test('a Stock page has no serious accessibility problems', {
    tag: ['@a11y', '@regression'],
  }, async ({ stockPage, page }) => {
    await stockPage.goto('KRYL');
    await page.clock.resume();

    const report = await scanPage(page, 'stock');

    expect(report.blocking, reportFor(report)).toEqual([]);
  });

  test('the Portfolio page has no serious accessibility problems', {
    tag: ['@a11y', '@regression'],
  }, async ({ portfolioPage, page }) => {
    await portfolioPage.goto();
    await page.clock.resume();

    const report = await scanPage(page, 'portfolio');

    expect(report.blocking, reportFor(report)).toEqual([]);
  });

  test('the Wallet page has no serious accessibility problems', {
    tag: ['@a11y', '@regression'],
  }, async ({ walletPage, page }) => {
    await walletPage.goto();
    await page.clock.resume();

    const report = await scanPage(page, 'wallet');

    expect(report.blocking, reportFor(report)).toEqual([]);
  });

  test('the Watchlist page has no serious accessibility problems', {
    tag: ['@a11y', '@regression'],
  }, async ({ watchlistPage, page }) => {
    await watchlistPage.goto();
    await page.clock.resume();

    const report = await scanPage(page, 'watchlist');

    expect(report.blocking, reportFor(report)).toEqual([]);
  });

  test('the Profile page has no serious accessibility problems', {
    tag: ['@a11y', '@regression'],
  }, async ({ profilePage, page }) => {
    await profilePage.goto();
    await page.clock.resume();

    const report = await scanPage(page, 'profile');

    expect(report.blocking, reportFor(report)).toEqual([]);
  });

  test('the Rules page has no serious accessibility problems', {
    tag: ['@a11y', '@regression'],
  }, async ({ rulesPage, page }) => {
    await rulesPage.goto();
    await page.clock.resume();

    const report = await scanPage(page, 'rules');

    expect(report.blocking, reportFor(report)).toEqual([]);
  });
});
