import { readFile } from 'node:fs/promises';
import { test, expect } from '../../fixtures/test-fixtures';
import { NEWBIE, TRADER } from '../../data/demo-accounts';
import { historyFileName } from '../../data/expected-text';
import { MARKET_DAY } from '../../config/test-settings';
import { money } from '../../utils/money';
import { expectTopUpsStopAtTheLimit } from '../../checks/wallet-checks';

test.describe('Adding practice money', () => {
  test.use({ storageState: NEWBIE.storageState });

  test(
    'top-ups stop once the account has added $50,000 in all',
    { tag: ['@regression', '@p1', '@REQ-WALLET-02'] },
    async ({ walletPage }) => {
      await walletPage.goto();

      // The same check the bug hunt makes with bug=limit switched on, which lets
      // one more top-up through than the rule allows.
      await expectTopUpsStopAtTheLimit(walletPage, NEWBIE);
    },
  );
});

test.describe('The wallet of a trader who has been trading', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'start over puts the account back to the money it began with',
    { tag: ['@regression', '@p2', '@REQ-WALLET-03'] },
    async ({ accountState, walletPage, topMenu }) => {
      await accountState.forUser(TRADER).withCash(50_000).withNoHoldings().apply();

      await walletPage.goto();
      await accountState.expectApplied();
      await expect(walletPage.cash).toHaveAttribute('data-cents', '50000');

      await walletPage.startOver();

      await expect(walletPage.startOverMessage()).toBeVisible();
      await expect(walletPage.cash).toHaveText(money(TRADER.start.cashCents));
      await expect(walletPage.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
      await expect(topMenu.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
    },
  );

  test(
    'the history downloads as a CSV named after today in Dhaka',
    { tag: ['@regression', '@p2', '@REQ-WALLET-04', '@REQ-HISTORY-03'] },
    async ({ walletPage }) => {
      await walletPage.goto();

      const download = await walletPage.downloadHistory();

      expect(download.suggestedFilename()).toBe(historyFileName(MARKET_DAY));

      await test.step('the file holds the trader history', async () => {
        const savedAt = await download.path();
        const csv = await readFile(savedAt, 'utf8');
        const lines = csv.trim().split('\r\n');

        expect(lines[0]).toBe('time_dhaka,type,symbol,shares,price,amount,cash_after');
        expect(lines).toHaveLength(TRADER.start.history.length + 1);
      });
    },
  );
});
