// The seed the Playwright test agents start from.
//
// `npx playwright init-agents --loop=claude` writes a bare seed file that
// imports @playwright/test and opens nothing. This is that file, fitted to
// this repo: the fixture from fixtures/test-fixtures.ts, a saved login from
// .auth/, and with them the frozen clock, the app switches and the popup
// handlers. The planner and the generator run this file to set the page up
// before they explore or record anything, so what they see is what a real test
// here would see.
//
// It is tagged @seed and runs in the `seed` project only, so it is never part
// of an everyday run. scripts/read-tests-and-requirements.mjs leaves it out of
// the tag check and the coverage table, the way it leaves out the login setup.

import { test, expect } from '../fixtures/test-fixtures';
import { TRADER } from '../data/demo-accounts';
import { money } from '../utils/money';

test.use({ storageState: TRADER.storageState });

test.describe('Seed', () => {
  test(
    'starts logged in on the Market page',
    { tag: ['@seed'] },
    async ({ marketPage, topMenu }) => {
      await marketPage.goto();

      await expect(topMenu.cash).toContainText(money(TRADER.start.cashCents));

      // The generator records its steps from here.
    },
  );
});
