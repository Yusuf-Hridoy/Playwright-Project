// The Wallet page: cash, adding practice money by card, starting over and
// the history.

import type { Download, Locator, Page } from '@playwright/test';
import { BasePage } from './base-page';
import type { PageObjectOptions } from './base-page';
import { ConfirmDialog } from '../components/confirm-dialog';
import { PaymentFrame, TEST_CARDS } from '../components/payment-frame';
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

  /** The card step that opens under the amounts (App Phase 4). */
  readonly payStep: Locator;
  /** "Paying $5,000". */
  readonly payAmount: Locator;
  readonly payCancelButton: Locator;
  readonly paymentFrame: PaymentFrame;

  readonly startOverButton: Locator;
  readonly startOverDialog: ConfirmDialog;

  readonly historyTable: Locator;
  readonly downloadButton: Locator;

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
    this.payCancelButton = this.payStep.getByRole('button', { name: TEXT.common.cancel });
    this.paymentFrame = new PaymentFrame(page);

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
