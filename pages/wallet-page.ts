// The Wallet page: cash, adding practice money, starting over and the history.

import type { Download, Locator, Page } from '@playwright/test';
import { BasePage } from './base-page';
import { ConfirmDialog } from '../components/confirm-dialog';
import { TEXT } from '../data/expected-text';
import { centsOf } from '../utils/money';

/** The three top-up buttons, written the way the app writes them. */
export type AddAmount = '$1,000' | '$5,000' | '$10,000';

export class WalletPage extends BasePage {
  readonly heading: Locator;
  /** The big cash figure. Its data-cents attribute holds the exact amount. */
  readonly cash: Locator;

  readonly addButton: Locator;
  readonly addMessage: Locator;
  readonly addError: Locator;
  readonly addProgress: Locator;

  readonly startOverButton: Locator;
  readonly startOverDialog: ConfirmDialog;

  readonly historyTable: Locator;
  readonly downloadButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: TEXT.wallet.title });
    this.cash = page.getByTestId('wallet-cash');

    // The button names the amount it will add, like "Add $5,000".
    this.addButton = page.getByRole('button', { name: /^Add \$[\d,]+$/ });
    this.addMessage = page.getByTestId('add-message');
    this.addError = page.getByTestId('add-error');
    this.addProgress = page.getByTestId('add-progress');

    this.startOverButton = page.getByRole('button', { name: TEXT.wallet.startOverButton, exact: true });
    this.startOverDialog = new ConfirmDialog(page.getByTestId('start-over-dialog'), {
      confirm: TEXT.wallet.startOverConfirm,
      cancel: TEXT.common.cancel,
    });

    this.historyTable = page.getByTestId('history-table');
    this.downloadButton = page.getByRole('button', { name: TEXT.wallet.download });
  }

  protected override readyElement(): Locator {
    return this.cash;
  }

  async goto(): Promise<void> {
    await this.open('wallet');
  }

  async cashCents(): Promise<number> {
    return centsOf(this.cash);
  }

  amountChoice(amount: AddAmount): Locator {
    return this.page.getByRole('radio', { name: amount });
  }

  /** Picks one of the three amounts and presses Add. */
  async addMoney(amount: AddAmount): Promise<void> {
    await this.amountChoice(amount).check();
    await this.addButton.click();
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

  /** Presses Download CSV and hands back the file the browser got. */
  async downloadHistory(): Promise<Download> {
    const waitForDownload = this.page.waitForEvent('download');
    await this.downloadButton.click();
    return waitForDownload;
  }
}
