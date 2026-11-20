// The card form the Wallet page opens inside an iframe (App Phase 4).
//
// The frame is a page of its own, so everything inside it is reached through
// frameLocator. The title is the frame's accessible name and the only stable
// thing about it, which is why the frame itself is found by that title.
//
// Pressing Pay starts a two second "Processing…" timer in the frame. The clock
// is frozen for every test, so nothing moves on its own: pay() presses the
// button and stops there, and finishProcessing() lets the timer run out. A
// test that only cares about the result uses payWith(), which does both.

import type { FrameLocator, Locator, Page } from '@playwright/test';
import { TEXT } from '../data/expected-text';
import { renamedTestId } from '../data/label-synonyms';
import { healing } from '../utils/healing-locator';

/** The three cards the app knows, from ../Practice-App/js/payment-rules.js. */
export const TEST_CARDS = Object.freeze({
  works: '4242424242424242',
  declined: '4000000000000002',
  noFunds: '4000000000009995',
});

/** The three cards exactly as the Wallet page prints them in its list. */
export const TEST_CARDS_AS_SHOWN: readonly string[] = Object.freeze([
  '4242 4242 4242 4242',
  '4000 0000 0000 0002',
  '4000 0000 0000 9995',
]);

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

/** The four fields on the card form. */
export type CardField = 'name' | 'number' | 'expiry' | 'cvc';

/** What to type in each field. Anything left out is not touched. */
export interface CardDetails {
  readonly name?: string;
  readonly number?: string;
  readonly expiry?: string;
  readonly cvc?: string;
}

/** A whole card that passes every check, for a test that wants to change one field. */
export const GOOD_CARD: Required<CardDetails> = Object.freeze({
  name: CARD_HOLDER,
  number: TEST_CARDS.works,
  expiry: FUTURE_EXPIRY,
  cvc: CVC,
});

export class PaymentFrame {
  readonly frame: FrameLocator;

  readonly nameField: Locator;
  readonly numberField: Locator;
  readonly expiryField: Locator;
  readonly cvcField: Locator;
  /** The button names the amount, like "Pay $5,000". */
  readonly payButton: Locator;
  /**
   * The same button while the card is being processed. It is a second locator
   * rather than a state of the first, because the button's name is what
   * changes: "Pay $5,000" becomes "Processing…" for two seconds.
   */
  readonly processingButton: Locator;
  /** The line that says a card was turned down. */
  readonly result: Locator;

  readonly nameError: Locator;
  readonly numberError: Locator;
  readonly expiryError: Locator;
  readonly cvcError: Locator;

  constructor(private readonly page: Page) {
    this.frame = page.frameLocator(`iframe[title="${TEXT.payment.frameTitle}"]`);

    // The card form carries the same switches as the page around it, so its
    // test ids can be renamed under the test's feet as well. The labels on the
    // four fields are not among the words the app renames, so they make good
    // backup ways.
    this.nameField = this.cardField('name', TEXT.payment.nameLabel, 'card-name');
    this.numberField = this.cardField('number', TEXT.payment.numberLabel, 'card-number');
    this.expiryField = this.cardField('expiry', TEXT.payment.expiryLabel, 'card-expiry');
    this.cvcField = this.cardField('cvc', TEXT.payment.cvcLabel, 'card-cvc');
    this.payButton = healing({
      where: 'PaymentFrame',
      element: 'Pay button',
      ways: [
        { how: 'role button named Pay and an amount', locator: this.frame.getByRole('button', { name: /^Pay \$[\d,]+$/ }) },
        { how: 'renamed test id card-pay', locator: this.frame.getByTestId(renamedTestId('card-pay')) },
      ],
    });
    this.processingButton = this.frame.getByRole('button', { name: TEXT.payment.processing });
    this.result = this.frame.getByTestId('card-result');

    this.nameError = this.frame.getByTestId('card-name-error');
    this.numberError = this.frame.getByTestId('card-number-error');
    this.expiryError = this.frame.getByTestId('card-expiry-error');
    this.cvcError = this.frame.getByTestId('card-cvc-error');
  }

  /** One field of the card form, with its label as the backup way. */
  private cardField(field: CardField, label: string, testId: string): Locator {
    return healing({
      where: 'PaymentFrame',
      element: `${field} field`,
      ways: [
        { how: `label ${label}`, locator: this.frame.getByLabel(label) },
        { how: `renamed test id ${testId}`, locator: this.frame.getByTestId(renamedTestId(testId)) },
      ],
    });
  }

  /** The input for one field, for a test that walks all four. */
  field(field: CardField): Locator {
    const fields: Readonly<Record<CardField, Locator>> = {
      name: this.nameField,
      number: this.numberField,
      expiry: this.expiryField,
      cvc: this.cvcField,
    };
    return fields[field];
  }

  /** The message under one field. Empty while that field is fine. */
  fieldError(field: CardField): Locator {
    const errors: Readonly<Record<CardField, Locator>> = {
      name: this.nameError,
      number: this.numberError,
      expiry: this.expiryError,
      cvc: this.cvcError,
    };
    return errors[field];
  }

  /** Types in one field and leaves the other three alone. */
  async fillField(field: CardField, value: string): Promise<void> {
    await this.field(field).fill(value);
  }

  /** Types in the fields that are named, one at a time, in form order. */
  async fillCard(details: CardDetails): Promise<void> {
    if (details.name !== undefined) await this.fillField('name', details.name);
    if (details.number !== undefined) await this.fillField('number', details.number);
    if (details.expiry !== undefined) await this.fillField('expiry', details.expiry);
    if (details.cvc !== undefined) await this.fillField('cvc', details.cvc);
  }

  /**
   * Presses Pay and comes straight back, without moving the clock. The frame
   * is left in the middle of its two second wait, which is where a test can
   * see "Processing…" on the button.
   */
  async pay(): Promise<void> {
    await this.payButton.click();
  }

  /** Lets the two second processing timer run out, so the result shows. */
  async finishProcessing(): Promise<void> {
    await this.page.clock.runFor(PROCESSING_MS);
  }

  /** Fills every field in, presses Pay and lets the processing timer run out. */
  async payWith(cardNumber: string): Promise<void> {
    await this.fillCard({ ...GOOD_CARD, number: cardNumber });
    await this.pay();
    await this.finishProcessing();
  }
}
