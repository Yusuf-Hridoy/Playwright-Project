// Three pages, compared against a picture of themselves.
//
// Screenshots are kept per operating system, because the same page drawn with
// Windows, Mac and Linux fonts is never pixel for pixel the same. The
// baselines in this repository were made on Windows; Linux baselines for CI
// come in Phase 3. Run `npm run update-snapshots` after a change you meant to
// make, and look at the new pictures before keeping them.
//
// Nothing moves in these pages: the clock is frozen, the seed is 42, and
// animations are turned off for the shot.

import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';

const SHOT = {
  fullPage: true,
  animations: 'disabled',
  maxDiffPixelRatio: 0.01,
} as const;

test.describe('How the pages look', () => {
  test(
    'the log in page',
    { tag: ['@visual', '@regression', '@p3', '@REQ-A11Y-03'] },
    async ({ loginPage, page }) => {
      await loginPage.goto();

      await expect(page).toHaveScreenshot('login-page.png', SHOT);
    },
  );

  test(
    'the Rules page',
    { tag: ['@visual', '@regression', '@p3', '@REQ-A11Y-03'] },
    async ({ rulesPage, page }) => {
      await rulesPage.goto();

      await expect(page).toHaveScreenshot('rules-page.png', SHOT);
    },
  );
});

test.describe('How the Market looks to a trader', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'the Market page',
    { tag: ['@visual', '@regression', '@p3', '@REQ-A11Y-03'] },
    async ({ marketPage, page }) => {
      await marketPage.goto();

      await expect(page).toHaveScreenshot('market-page.png', SHOT);
    },
  );
});
