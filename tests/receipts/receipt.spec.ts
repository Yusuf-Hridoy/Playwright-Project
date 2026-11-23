// The receipt behind every history row.
//
// The Open link in the Wallet carries target="_blank", so a receipt always
// arrives in a tab of its own. The page has no top menu: it is meant to be
// printed, and its buttons are hidden on paper.

import { test, expect } from '../../fixtures/test-fixtures';
import { ReceiptPage } from '../../pages/receipt-page';
import { BUSY, TRADER } from '../../data/demo-accounts';
import { TEXT, cardEnding, receiptNumber, sharesOf } from '../../data/expected-text';

/** The newest row in Trader's history: 5 KRYL bought at $140.72. */
const TRADER_BUY = TRADER.start.history[2];

/** The newest top-up in Busy's history, paid for with card 4242. */
const BUSY_TOP_UP = BUSY.start.history[20];

test.describe('Opening a receipt from the history', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'Open on a buy opens a tab with what was bought and what it cost',
    {
      tag: ['@regression', '@p2', '@REQ-HISTORY-04'],
    },
    async ({ walletPage }) => {
      await walletPage.goto();

      // Newest first, so the first row is the most recent buy.
      const tab = await walletPage.openReceipt(0);
      const receipt = new ReceiptPage(tab);
      await receipt.waitUntilReady();

      await expect(receipt.number).toHaveText(receiptNumber(TRADER.accountId, TRADER_BUY.id));
      await expect(receipt.date).toContainText('Dhaka time');

      await test.step('what was bought', async () => {
        await expect(receipt.row('bought')).toContainText(TEXT.receipt.bought);
        await expect(receipt.row('bought')).toContainText(
          sharesOf(TRADER_BUY.shares!, TRADER_BUY.symbol!),
        );
      });

      await test.step('the price per share, the total and the cash left', async () => {
        await expect(receipt.row('price-per-share')).toContainText(TEXT.receipt.pricePerShare);
        expect(await receipt.rowAmountCents('price-per-share')).toBe(TRADER_BUY.priceCents);

        await expect(receipt.row('total')).toContainText(TEXT.receipt.total);
        expect(await receipt.rowAmountCents('total')).toBe(Math.abs(TRADER_BUY.amountCents));

        await expect(receipt.row('cash-after')).toContainText(TEXT.receipt.cashAfter);
        expect(await receipt.cashAfterCents()).toBe(TRADER_BUY.cashAfterCents);
      });

      // A receipt is for reading and printing: no sell row ever belongs on a buy.
      await expect(receipt.row('sold')).toHaveCount(0);
    },
  );
});

test.describe('A receipt for money that was added', () => {
  test.use({ storageState: BUSY.storageState });

  test(
    'says which card paid for it',
    { tag: ['@regression', '@p2', '@REQ-HISTORY-04'] },
    async ({ receiptPage }) => {
      await receiptPage.goto(BUSY_TOP_UP.id);

      await expect(receiptPage.row('added')).toContainText(TEXT.receipt.added);
      expect(await receiptPage.rowAmountCents('added')).toBe(BUSY_TOP_UP.amountCents);

      await expect(receiptPage.row('paid-with')).toContainText(TEXT.receipt.paidWith);
      await expect(receiptPage.row('paid-with')).toContainText(cardEnding(BUSY_TOP_UP.last4!));

      expect(await receiptPage.cashAfterCents()).toBe(BUSY_TOP_UP.cashAfterCents);
    },
  );
});

test.describe('Printing a receipt', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'the Print button asks the browser to print, once',
    { tag: ['@regression', '@p2', '@REQ-HISTORY-04'] },
    async ({ receiptPage, page }) => {
      // window.print() opens a dialog no test can close, so it is swapped for a
      // counter before the page loads and never actually runs.
      await page.addInitScript(() => {
        const counted = window as unknown as { printCalls: number };
        counted.printCalls = 0;
        window.print = () => {
          counted.printCalls += 1;
        };
      });

      await receiptPage.goto(TRADER_BUY.id);
      expect(
        await page.evaluate(() => (window as unknown as { printCalls: number }).printCalls),
      ).toBe(0);

      await receiptPage.print();

      expect(
        await page.evaluate(() => (window as unknown as { printCalls: number }).printCalls),
      ).toBe(1);
      // Printing changes nothing on screen: the receipt is still there to read.
      await expect(receiptPage.receipt).toBeVisible();
    },
  );
});

test.describe('A receipt that does not exist', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'says so instead of showing an empty receipt',
    { tag: ['@regression', '@p2', '@REQ-HISTORY-04'] },
    async ({ receiptPage }) => {
      await receiptPage.gotoWithoutWaiting('h-no-such-row');

      await expect(receiptPage.notFound).toBeVisible();
      await expect(
        receiptPage.page.getByRole('heading', { name: TEXT.receipt.notFoundTitle }),
      ).toBeVisible();
      await expect(receiptPage.notFound).toContainText(TEXT.receipt.notFoundBody);

      await expect(receiptPage.receipt).toHaveCount(0);
      // The way back is still offered.
      await expect(receiptPage.backToWalletLink).toBeVisible();
    },
  );
});
