import { readFile } from 'node:fs/promises';
import { test, expect } from '../../fixtures/test-fixtures';
import { ADD_CHOICES_CENTS, ADD_LIMIT_CENTS, NEWBIE, TRADER } from '../../data/demo-accounts';
import { PAYING_CARD_LAST4 } from '../../components/payment-frame';
import { addLimitReached, addedWithCard, historyFileName } from '../../data/expected-text';
import { MARKET_DAY } from '../../config/test-settings';
import { money } from '../../utils/money';

test.describe('Adding practice money', () => {
  test.use({ storageState: NEWBIE.storageState });

  test('top-ups stop once the account has added $50,000 in all', { tag: ['@regression'] }, async ({
    walletPage,
  }) => {
    const stepCents = ADD_CHOICES_CENTS['10000'];
    let cashCents = NEWBIE.start.cashCents;
    let addedCents = NEWBIE.start.totalAddedCents;

    await walletPage.goto();

    while (addedCents + stepCents <= ADD_LIMIT_CENTS) {
      cashCents += stepCents;
      addedCents += stepCents;

      await walletPage.addMoney('$10,000');

      await expect(walletPage.addMessage).toHaveText(
        addedWithCard('$10,000', PAYING_CARD_LAST4, money(cashCents)),
      );
      await expect(walletPage.cash).toHaveAttribute('data-cents', String(cashCents));
    }

    await test.step('one more top-up is refused before the card step opens', async () => {
      await walletPage.startAdding('$10,000');

      await expect(walletPage.addError).toHaveText(addLimitReached());
      await expect(walletPage.payStep).toBeHidden();
      await expect(walletPage.addMessage).toBeEmpty();
      await expect(walletPage.cash).toHaveAttribute('data-cents', String(cashCents));
    });
  });
});

test.describe('The wallet of a trader who has been trading', () => {
  test.use({ storageState: TRADER.storageState });

  test('start over puts the account back to the money it began with', { tag: ['@regression'] }, async ({
    accountState,
    walletPage,
    topMenu,
  }) => {
    await accountState.forUser(TRADER).withCash(50_000).withNoHoldings().apply();

    await walletPage.goto();
    await accountState.expectApplied();
    await expect(walletPage.cash).toHaveAttribute('data-cents', '50000');

    await walletPage.startOver();

    await expect(walletPage.startOverMessage()).toBeVisible();
    await expect(walletPage.cash).toHaveText(money(TRADER.start.cashCents));
    await expect(walletPage.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
    await expect(topMenu.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
  });

  test('the history downloads as a CSV named after today in Dhaka', { tag: ['@regression'] }, async ({
    walletPage,
  }) => {
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
  });
});
