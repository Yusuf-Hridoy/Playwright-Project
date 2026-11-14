// The Wallet page: cash, adding practice money by card, starting over and
// the history with its filters, its pages and its receipt links.

import type { Download, Locator, Page } from '@playwright/test';
import { BasePage } from './base-page';
import type { PageObjectOptions } from './base-page';
import { ConfirmDialog } from '../components/confirm-dialog';
import { PaymentFrame, TEST_CARDS } from '../components/payment-frame';
import { TEXT } from '../data/expected-text';
import { centsOf } from '../utils/money';

/** The three top-up buttons, written the way the app writes them. */
export type AddAmount = '$1,000' | '$5,000' | '$10,000';

/** The kinds of history row, as js/history-filters.js names them. */
export type HistoryFilterType = 'all' | 'buy' | 'sell' | 'add';

/** The Type menu's four choices, as the app prints them. */
export const TYPE_FILTER_LABELS: Readonly<Record<HistoryFilterType, string>> = Object.freeze({
  all: TEXT.wallet.filterAllTypes,
  buy: TEXT.wallet.filterBuys,
  sell: TEXT.wallet.filterSells,
  add: TEXT.wallet.filterTopUps,
});

export class WalletPage extends BasePage {
  readonly heading: Locator;
  /** The big cash figure. Its data-cents attribute holds the exact amount. */
  readonly cash: Locator;

  readonly addButton: Locator;
  readonly addMessage: Locator;
  readonly addError: Locator;
  readonly addProgress: Locator;

  /** The card step that opens under the amounts (App Phase 4). */
  readonly payStep: Locator;
  /** "Paying $5,000". */
  readonly payAmount: Locator;
  /** The box listing the three cards that can be used. */
  readonly testCards: Locator;
  readonly payCancelButton: Locator;
  readonly paymentFrame: PaymentFrame;

  readonly startOverButton: Locator;
  readonly startOverDialog: ConfirmDialog;

  readonly historyTable: Locator;
  readonly downloadButton: Locator;
  /** The line that shows instead of the table when nothing matches. */
  readonly historyEmpty: Locator;

  readonly typeFilter: Locator;
  readonly fromFilter: Locator;
  readonly toFilter: Locator;
  readonly clearFiltersButton: Locator;
  /** The message about a From date that comes after the To date. */
  readonly filterError: Locator;

  /** "Showing 1 to 10 of 24". */
  readonly pageInfo: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;

  constructor(page: Page, options: PageObjectOptions = {}) {
    super(page, options);
    this.heading = page.getByRole('heading', { name: TEXT.wallet.title });
    this.cash = page.getByTestId('wallet-cash');

    // The button names the amount it will add, like "Add $5,000".
    this.addButton = page.getByRole('button', { name: /^Add \$[\d,]+$/ });
    this.addMessage = page.getByTestId('add-message');
    this.addError = page.getByTestId('add-error');
    this.addProgress = page.getByTestId('add-progress');

    this.payStep = page.getByTestId('pay-step');
    this.payAmount = page.getByTestId('pay-amount');
    this.testCards = page.getByTestId('test-cards');
    this.payCancelButton = this.payStep.getByRole('button', { name: TEXT.common.cancel });
    this.paymentFrame = new PaymentFrame(page);

    this.startOverButton = page.getByRole('button', { name: TEXT.wallet.startOverButton, exact: true });
    this.startOverDialog = new ConfirmDialog(page.getByTestId('start-over-dialog'), {
      confirm: TEXT.wallet.startOverConfirm,
      cancel: TEXT.common.cancel,
    });

    this.historyTable = page.getByTestId('history-table');
    this.downloadButton = page.getByRole('button', { name: TEXT.wallet.download });
    this.historyEmpty = page.getByTestId('history-empty');

    this.typeFilter = page.getByLabel(TEXT.wallet.filterTypeLabel, { exact: true });
    this.fromFilter = page.getByLabel(TEXT.wallet.filterFromLabel, { exact: true });
    this.toFilter = page.getByLabel(TEXT.wallet.filterToLabel, { exact: true });
    this.clearFiltersButton = page.getByRole('button', { name: TEXT.wallet.clearFilters });
    this.filterError = page.getByTestId('history-filter-error');

    this.pageInfo = page.getByTestId('history-page-info');
    this.previousButton = page.getByRole('button', { name: TEXT.wallet.previous });
    this.nextButton = page.getByRole('button', { name: TEXT.wallet.next });
  }

  protected override readyElement(): Locator {
    return this.cash;
  }

  async goto(): Promise<void> {
    await this.open('wallet');
  }

  /**
   * Opens the Wallet with filters and a page already in the link, the way a
   * shared URL or the Back button would.
   */
  async gotoWithQuery(query: Readonly<Record<string, string>>): Promise<void> {
    await this.open('wallet', query);
  }

  async cashCents(): Promise<number> {
    return centsOf(this.cash);
  }

  amountChoice(amount: AddAmount): Locator {
    return this.page.getByRole('radio', { name: amount });
  }

  /** Picks one of the three amounts and presses Add, which opens the card step. */
  async startAdding(amount: AddAmount): Promise<void> {
    await this.amountChoice(amount).check();
    await this.addButton.click();
  }

  /**
   * The whole top-up: pick the amount, press Add, then pay with the card that
   * always works. Any other card is a test about the card itself, and goes
   * through startAdding() and the payment frame instead.
   */
  async addMoney(amount: AddAmount): Promise<void> {
    await this.startAdding(amount);
    await this.paymentFrame.payWith(TEST_CARDS.works);
  }

  /** Closes the card step without paying. */
  async cancelPayment(): Promise<void> {
    await this.payCancelButton.click();
  }

  /** One line of the test card list, like "4242 4242 4242 4242". */
  testCardRow(shownNumber: string): Locator {
    return this.testCards.getByText(shownNumber, { exact: true });
  }

  /** Presses Start over and says yes in the dialog. */
  async startOver(): Promise<void> {
    await this.startOverButton.click();
    await this.startOverDialog.confirm();
  }

  /** The line that shows after a successful start over. */
  startOverMessage(): Locator {
    return this.page.getByText(TEXT.wallet.startOverDone);
  }

  historyRows(): Locator {
    return this.page.getByTestId('history-row');
  }

  /** The newest history rows of one kind: "start", "add", "buy" or "sell". */
  historyRowsOfType(type: 'start' | 'add' | 'buy' | 'sell'): Locator {
    return this.historyRows().and(this.page.locator(`[data-type="${type}"]`));
  }

  /** The Open link in one row of the table that is on screen. Rows count from 0. */
  receiptLink(rowIndex: number): Locator {
    return this.historyRows().nth(rowIndex).getByRole('link');
  }

  /**
   * Opens one row's receipt and hands back the tab it opened in. The link
   * carries target="_blank", so the receipt is always a second page.
   */
  async openReceipt(rowIndex: number): Promise<Page> {
    const waitForTab = this.page.context().waitForEvent('page');
    await this.receiptLink(rowIndex).click();
    const tab = await waitForTab;
    await tab.waitForLoadState();
    return tab;
  }

  // --- the history filters ---

  /** Picks one kind of row in the Type menu. */
  async filterByType(type: HistoryFilterType): Promise<void> {
    await this.typeFilter.selectOption({ label: TYPE_FILTER_LABELS[type] });
  }

  /** Sets the From date, as "YYYY-MM-DD". */
  async setFrom(date: string): Promise<void> {
    await this.fromFilter.fill(date);
  }

  /** Sets the To date, as "YYYY-MM-DD". */
  async setTo(date: string): Promise<void> {
    await this.toFilter.fill(date);
  }

  async clearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
  }

  // --- the page controls ---

  /** One numbered page button. Its accessible name is "Page 2". */
  pageButton(page: number): Locator {
    return this.page.getByRole('button', { name: `Page ${page}`, exact: true });
  }

  /** Every numbered page button, for counting them. */
  pageButtons(): Locator {
    return this.page.getByTestId('history-page');
  }

  async goToPage(page: number): Promise<void> {
    await this.pageButton(page).click();
  }

  async goToNextPage(): Promise<void> {
    await this.nextButton.click();
  }

  async goToPreviousPage(): Promise<void> {
    await this.previousButton.click();
  }

  /** Presses Download CSV and hands back the file the browser got. */
  async downloadHistory(): Promise<Download> {
    const waitForDownload = this.page.waitForEvent('download');
    await this.downloadButton.click();
    return waitForDownload;
  }
}
