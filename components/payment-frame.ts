// The card form the Wallet page opens inside an iframe (App Phase 4).
//
// The frame is a page of its own, so everything inside it is reached through
// frameLocator. The title is the frame's accessible name and the only stable
// thing about it, which is why the frame itself is found by that title.
//
// Pressing Pay starts a two second "Processing…" timer in the frame. The clock
// is frozen for every test, so payWith() moves it along instead of waiting.

import type { FrameLocator, Locator, Page } from '@playwright/test';
import { TEXT } from '../data/expected-text';

/** The three cards the app knows, from ../Practice-App/js/payment-rules.js. */
export const TEST_CARDS = Object.freeze({
  works: '4242424242424242',
  declined: '4000000000000002',
  noFunds: '4000000000009995',
});

/** A card the app has never heard of. */
export const UNKNOWN_CARD = '4111111111111111';

/** The last four digits of the card every top-up in these tests pays with. */
export const PAYING_CARD_LAST4 = '4242';

/** How long "Processing…" lasts, from js/payment-rules.js. */
export const PROCESSING_MS = 2_000;

/** An expiry that is still in the future at the frozen clock's moment. */
export const FUTURE_EXPIRY = '12/30';

export const CVC = '123';

export const CARD_HOLDER = 'Test Payer';

export class PaymentFrame {
  readonly frame: FrameLocator;

  readonly nameField: Locator;
  readonly numberField: Locator;
  readonly expiryField: Locator;
  readonly cvcField: Locator;
  /** The button names the amount, like "Pay $5,000". */
  readonly payButton: Locator;
  /** The line that says a card was turned down. */
  readonly result: Locator;

  constructor(private readonly page: Page) {
    this.frame = page.frameLocator(`iframe[title="${TEXT.payment.frameTitle}"]`);

    this.nameField = this.frame.getByLabel(TEXT.payment.nameLabel);
    this.numberField = this.frame.getByLabel(TEXT.payment.numberLabel);
    this.expiryField = this.frame.getByLabel(TEXT.payment.expiryLabel);
    this.cvcField = this.frame.getByLabel(TEXT.payment.cvcLabel);
    this.payButton = this.frame.getByRole('button', { name: /^Pay \$[\d,]+$/ });
    this.result = this.frame.getByTestId('card-result');
  }

  /** Fills every field in, presses Pay and lets the processing timer run out. */
  async payWith(cardNumber: string): Promise<void> {
    await this.nameField.fill(CARD_HOLDER);
    await this.numberField.fill(cardNumber);
    await this.expiryField.fill(FUTURE_EXPIRY);
    await this.cvcField.fill(CVC);
    await this.payButton.click();
    await this.page.clock.runFor(PROCESSING_MS);
  }
}
