// spec: specs/REQ-WALLET-01.md
// seed: tests/seed.spec.ts

import { test, expect } from '../../fixtures/test-fixtures';
import { ADD_LIMIT_CENTS, NEWBIE, START_CASH_CENTS } from '../../data/demo-accounts';
import { TEXT, addedSoFar } from '../../data/expected-text';
import { money } from '../../utils/money';

test.describe('A brand new account', () => {
  // The newbie has never traded and never topped up, so the account the app
  // seeds is the account it starts every one of them with. Nothing here is
  // written by the state builder, on purpose: the figure under test is the
  // app's own, not ours.
  test.use({ storageState: NEWBIE.storageState });

  test(
    'starts with $10,000, as cash and as one starting row in the history',
    { tag: ['@regression', '@p1', '@REQ-WALLET-01'] },
    async ({ walletPage, portfolioPage, topMenu }) => {
      await walletPage.goto();

      await test.step('the cash is $10,000, on the page and in the menu', async () => {
        await expect(walletPage.cash).toHaveText(money(START_CASH_CENTS));
        await expect(walletPage.cash).toHaveAttribute('data-cents', String(START_CASH_CENTS));
        await expect(topMenu.cash).toHaveAttribute('data-cents', String(START_CASH_CENTS));
      });

      await test.step('the history is one starting row of $10,000', async () => {
        await expect(walletPage.historyRows()).toHaveCount(1);

        const startRow = walletPage.historyRowsOfType('start');
        await expect(startRow).toHaveCount(1);
        await expect(startRow).toContainText(TEXT.wallet.historyStart);

        // The row's two money columns: what it added, then the cash it left.
        const amounts = walletPage.historyMoneyCells(startRow);
        await expect(amounts.first()).toHaveAttribute('data-cents', String(START_CASH_CENTS));
        await expect(amounts.last()).toHaveAttribute('data-cents', String(START_CASH_CENTS));
      });

      await test.step('the $10,000 counts towards the $50,000 add limit', async () => {
        await expect(walletPage.addProgress).toHaveAttribute('max', String(ADD_LIMIT_CENTS));
        await expect(walletPage.addProgress).toHaveAttribute('value', String(START_CASH_CENTS));
        // The meter is labelled by the line above it, so its accessible name
        // is that line word for word.
        await expect(walletPage.addProgress).toHaveAccessibleName(
          addedSoFar(money(START_CASH_CENTS)),
        );
      });

      await test.step('none of it has been spent yet', async () => {
        await portfolioPage.goto();

        await expect(portfolioPage.allRows()).toHaveCount(0);
        await expect(portfolioPage.cash).toHaveAttribute('data-cents', String(START_CASH_CENTS));
        await expect(portfolioPage.totalWorth).toHaveAttribute(
          'data-cents',
          String(START_CASH_CENTS),
        );
      });
    },
  );
});
