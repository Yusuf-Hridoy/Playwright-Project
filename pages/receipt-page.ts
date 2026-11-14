// One receipt, opened from a history row in the Wallet.
//
// The app opens it with target="_blank", so a test usually gets here through
// WalletPage.openReceipt(), which hands back the new tab. The page object is
// built on whichever Page it is given, so the tab it came from makes no
// difference to it.
//
// There is no top menu here: the page is meant to be printed, and the buttons
// are hidden on paper.

import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base-page';
import type { PageObjectOptions } from './base-page';
import { TEXT } from '../data/expected-text';
import { centsOf } from '../utils/money';

/**
 * The data-label on each row of a receipt, from js/pages/receipt-page.js.
 * Which rows there are depends on what the history row was.
 */
export type ReceiptRowLabel =
  | 'bought'
  | 'sold'
  | 'price-per-share'
  | 'total'
  | 'added'
  | 'paid-with'
  | 'starting-money'
  | 'cash-after';

export class ReceiptPage extends BasePage {
  /** The whole receipt card. */
  readonly receipt: Locator;
  /** "#TL-4821-TR-H2". */
  readonly number: Locator;
  /** "9 Nov 2026, 10:00 Dhaka time", or whatever the row's time was. */
  readonly date: Locator;
  /** The cash the account was left with, with the exact figure in data-cents. */
  readonly cashAfter: Locator;

  readonly printButton: Locator;
  readonly backToWalletLink: Locator;

  /** The card that shows instead when the id belongs to no history row. */
  readonly notFound: Locator;

  constructor(page: Page, options: PageObjectOptions = {}) {
    super(page, options);
    this.receipt = page.getByTestId('receipt');
    this.number = page.getByTestId('receipt-number');
    this.date = page.getByTestId('receipt-date');
    this.cashAfter = page.getByTestId('receipt-cash-after');

    this.printButton = page.getByRole('button', { name: TEXT.receipt.print });
    this.backToWalletLink = page.getByRole('link', { name: TEXT.receipt.backToWallet });

    this.notFound = page.getByTestId('receipt-not-found');
  }

  protected override readyElement(): Locator {
    return this.receipt;
  }

  /** Opens the receipt for one history row id, like "h2". */
  async goto(historyId: string): Promise<void> {
    await this.open('receipt', { id: historyId });
  }

  /**
   * Opens a receipt without waiting for one to draw. An id that matches no
   * history row never draws a receipt, and that is the point of the test.
   */
  async gotoWithoutWaiting(historyId: string): Promise<void> {
    await this.openWithoutWaiting('receipt', { id: historyId });
  }

  /** Every row of the receipt, in the order it prints them. */
  rows(): Locator {
    return this.page.getByTestId('receipt-row');
  }

  /** One row, found by the label the app gives it. */
  row(label: ReceiptRowLabel): Locator {
    return this.rows().and(this.page.locator(`[data-label="${label}"]`));
  }

  /**
   * The money inside one row. Every money value the app prints carries the
   * exact figure in data-cents, so a test never has to read the text back.
   */
  rowAmount(label: ReceiptRowLabel): Locator {
    return this.row(label).locator('[data-cents]');
  }

  /** The exact cents one row is worth. */
  async rowAmountCents(label: ReceiptRowLabel): Promise<number> {
    return centsOf(this.rowAmount(label));
  }

  async cashAfterCents(): Promise<number> {
    return centsOf(this.cashAfter);
  }

  async print(): Promise<void> {
    await this.printButton.click();
  }

  async backToWallet(): Promise<void> {
    await this.backToWalletLink.click();
  }
}
