// The Wallet history: ten rows to a page, a filter for the kind of row and
// one for the dates, and all of it kept in the link so it can be shared and
// walked back through.
//
// Busy is the account with enough history to page through: 24 rows, of which
// 12 are buys, 7 are sells, 4 are top-ups and 1 is the starting money.

import { readFile } from 'node:fs/promises';
import { test, expect } from '../../fixtures/test-fixtures';
import { BUSY } from '../../data/demo-accounts';
import { TEXT, showingText } from '../../data/expected-text';

/** One page of history, from js/history-filters.js. */
const PAGE_SIZE = 10;

const ALL_ROWS = BUSY.start.history.length;
const BUY_ROWS = BUSY.start.history.filter((entry) => entry.type === 'buy').length;
const SELL_ROWS = BUSY.start.history.filter((entry) => entry.type === 'sell').length;

/** Every row on or after this Dhaka day. Busy has ten of them. */
const FROM_DAY = '2026-11-01';
const ROWS_FROM_NOVEMBER = BUSY.start.history.filter((entry) => entry.time >= FROM_DAY).length;

/** A To date before the From date above, which is the pair the app refuses. */
const EARLIER_DAY = '2026-10-01';

test.describe('Paging through a long history', () => {
  test.use({ storageState: BUSY.storageState });

  test('shows ten rows at a time, and Next moves on', { tag: ['@regression'] }, async ({
    walletPage,
  }) => {
    await walletPage.goto();

    await expect(walletPage.pageInfo).toHaveText(showingText(1, PAGE_SIZE, ALL_ROWS));
    await expect(walletPage.historyRows()).toHaveCount(PAGE_SIZE);
    // 24 rows, ten to a page, is three pages.
    await expect(walletPage.pageButtons()).toHaveCount(3);
    await expect(walletPage.pageButton(1)).toHaveAttribute('aria-current', 'page');
    // There is nowhere to go back to from the first page.
    await expect(walletPage.previousButton).toBeHidden();

    await walletPage.goToNextPage();

    await expect(walletPage.pageInfo).toHaveText(showingText(11, 20, ALL_ROWS));
    await expect(walletPage.historyRows()).toHaveCount(PAGE_SIZE);
    await expect(walletPage.pageButton(2)).toHaveAttribute('aria-current', 'page');
    await expect(walletPage.previousButton).toBeVisible();
  });

  test('"Buys" leaves twelve rows across two pages', { tag: ['@regression'] }, async ({
    walletPage,
  }) => {
    await walletPage.goto();

    await walletPage.filterByType('buy');

    await expect(walletPage.pageInfo).toHaveText(showingText(1, PAGE_SIZE, BUY_ROWS));
    await expect(walletPage.pageButtons()).toHaveCount(2);
    await expect(walletPage.historyRows()).toHaveCount(PAGE_SIZE);
    await expect(walletPage.historyRowsOfType('buy')).toHaveCount(PAGE_SIZE);

    await walletPage.goToNextPage();

    await expect(walletPage.pageInfo).toHaveText(showingText(11, BUY_ROWS, BUY_ROWS));
    await expect(walletPage.historyRows()).toHaveCount(BUY_ROWS - PAGE_SIZE);
    await expect(walletPage.historyRowsOfType('buy')).toHaveCount(BUY_ROWS - PAGE_SIZE);
  });
});

test.describe('Filtering the history by date', () => {
  test.use({ storageState: BUSY.storageState });

  test('a From date after the To date is refused, and the table stays as it was', {
    tag: ['@regression'],
  }, async ({ walletPage }) => {
    await walletPage.goto();

    await test.step('a From date on its own works, and that is the last good result', async () => {
      await walletPage.setFrom(FROM_DAY);
      await expect(walletPage.filterError).toBeEmpty();
      await expect(walletPage.pageInfo).toHaveText(
        showingText(1, ROWS_FROM_NOVEMBER, ROWS_FROM_NOVEMBER),
      );
    });

    await walletPage.setTo(EARLIER_DAY);

    await expect(walletPage.filterError).toHaveText(TEXT.wallet.datesBackwards);
    await test.step('the rows are still the ones from the last good filter', async () => {
      await expect(walletPage.pageInfo).toHaveText(
        showingText(1, ROWS_FROM_NOVEMBER, ROWS_FROM_NOVEMBER),
      );
      await expect(walletPage.historyRows()).toHaveCount(ROWS_FROM_NOVEMBER);
      await expect(walletPage.historyEmpty).toBeHidden();
    });

    await test.step('clearing the filters puts every row back', async () => {
      await walletPage.clearFilters();
      await expect(walletPage.filterError).toBeEmpty();
      await expect(walletPage.pageInfo).toHaveText(showingText(1, PAGE_SIZE, ALL_ROWS));
    });
  });
});

test.describe('The history in the link', () => {
  test.use({ storageState: BUSY.storageState });

  test('the filter and the page are in the URL, and Back walks back through them', {
    tag: ['@regression'],
  }, async ({ walletPage, page }) => {
    await walletPage.goto();
    await expect(page).not.toHaveURL(/[?&]type=/);

    await walletPage.filterByType('buy');
    await expect(page).toHaveURL(/[?&]type=buy/);
    await expect(page).not.toHaveURL(/[?&]page=/);

    await walletPage.goToNextPage();
    await expect(page).toHaveURL(/[?&]type=buy/);
    await expect(page).toHaveURL(/[?&]page=2/);
    await expect(walletPage.pageInfo).toHaveText(showingText(11, BUY_ROWS, BUY_ROWS));

    await test.step('Back goes to page one of the same filter', async () => {
      await page.goBack();
      await expect(page).toHaveURL(/[?&]type=buy/);
      await expect(page).not.toHaveURL(/[?&]page=/);
      await expect(walletPage.pageInfo).toHaveText(showingText(1, PAGE_SIZE, BUY_ROWS));
      await expect(walletPage.typeFilter).toHaveValue('buy');
    });

    await test.step('Back again drops the filter', async () => {
      await page.goBack();
      await expect(page).not.toHaveURL(/[?&]type=/);
      await expect(walletPage.pageInfo).toHaveText(showingText(1, PAGE_SIZE, ALL_ROWS));
      await expect(walletPage.typeFilter).toHaveValue('all');
    });
  });

  test('values the app does not understand in the link fall back without a fuss', {
    tag: ['@regression'],
  }, async ({ walletPage, page }) => {
    await walletPage.gotoWithQuery({
      type: 'not-a-type',
      from: '09-11-2026',
      to: 'whenever',
      page: 'last',
    });

    await test.step('the whole history is shown, from the first page', async () => {
      await expect(walletPage.pageInfo).toHaveText(showingText(1, PAGE_SIZE, ALL_ROWS));
      await expect(walletPage.historyRows()).toHaveCount(PAGE_SIZE);
      await expect(walletPage.pageButton(1)).toHaveAttribute('aria-current', 'page');
    });

    await test.step('nothing is said about it, and the controls show the defaults', async () => {
      await expect(walletPage.filterError).toBeEmpty();
      await expect(walletPage.historyEmpty).toBeHidden();
      await expect(walletPage.typeFilter).toHaveValue('all');
      await expect(walletPage.fromFilter).toHaveValue('');
      await expect(walletPage.toFilter).toHaveValue('');
    });

    await test.step('the link is tidied up to match what is on screen', async () => {
      await expect(page).not.toHaveURL(/[?&]type=/);
      await expect(page).not.toHaveURL(/[?&]from=/);
      await expect(page).not.toHaveURL(/[?&]to=/);
      await expect(page).not.toHaveURL(/[?&]page=/);
    });
  });
});

test.describe('Downloading the history', () => {
  test.use({ storageState: BUSY.storageState });

  test('the CSV holds every filtered row, not just the page on screen', {
    tag: ['@regression'],
  }, async ({ walletPage }) => {
    await walletPage.goto();
    await walletPage.filterByType('sell');
    await expect(walletPage.pageInfo).toHaveText(showingText(1, SELL_ROWS, SELL_ROWS));

    const download = await walletPage.downloadHistory();
    const text = await readFile(await download.path(), 'utf8');
    const lines = text.split('\r\n').filter((line) => line !== '');

    // One header line, then one line per sell.
    expect(lines).toHaveLength(SELL_ROWS + 1);
    expect(lines[0]).toBe('time_dhaka,type,symbol,shares,price,amount,cash_after');
    for (const line of lines.slice(1)) {
      expect(line.split(',')[1]).toBe('sell');
    }
  });
});
