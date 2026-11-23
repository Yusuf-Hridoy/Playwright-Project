// Paying for a top-up with one of the three test cards.
//
// The card form lives in an iframe of its own and tells the Wallet what
// happened with a postMessage. Nothing here touches a real payment: the three
// cards and their answers come from ../Practice-App/js/payment-rules.js.

import { test, expect } from '../../fixtures/test-fixtures';
import {
  GOOD_CARD,
  PAYING_CARD_LAST4,
  PROCESSING_MS,
  TEST_CARDS,
  TEST_CARDS_AS_SHOWN,
  UNKNOWN_CARD,
  type CardField,
} from '../../components/payment-frame';
import { ADD_CHOICES_CENTS, ADD_LIMIT_CENTS, TRADER } from '../../data/demo-accounts';
import {
  TEXT,
  addLimitLeft,
  addedWithCard,
  historyAddWithCard,
  payingLine,
} from '../../data/expected-text';
import { money } from '../../utils/money';

const FIVE_THOUSAND = ADD_CHOICES_CENTS['5000'];

test.describe('Paying for a top-up by card', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'the card that works adds the money everywhere it is shown',
    {
      tag: ['@smoke', '@regression', '@p1', '@REQ-PAY-01'],
    },
    async ({ walletPage, topMenu }) => {
      const cashAfterCents = TRADER.start.cashCents + FIVE_THOUSAND;

      await walletPage.goto();
      await expect(walletPage.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));

      await walletPage.startAdding('$5,000');

      await test.step('the card step opens and says what is being paid', async () => {
        await expect(walletPage.payStep).toBeVisible();
        await expect(walletPage.payAmount).toHaveText(payingLine('$5,000'));
        for (const shown of TEST_CARDS_AS_SHOWN) {
          await expect(walletPage.testCardRow(shown)).toBeVisible();
        }
      });

      await walletPage.paymentFrame.payWith(TEST_CARDS.works);

      await expect(walletPage.addMessage).toHaveText(
        addedWithCard('$5,000', PAYING_CARD_LAST4, money(cashAfterCents)),
      );
      await expect(walletPage.payStep).toBeHidden();
      await expect(walletPage.cash).toHaveAttribute('data-cents', String(cashAfterCents));
      await expect(topMenu.cash).toHaveAttribute('data-cents', String(cashAfterCents));

      await test.step('the newest history row is the top-up, by that card', async () => {
        const newest = walletPage.historyRows().first();
        await expect(newest).toHaveAttribute('data-type', 'add');
        await expect(newest).toContainText(historyAddWithCard(PAYING_CARD_LAST4));
        await expect(walletPage.historyRows()).toHaveCount(TRADER.start.history.length + 1);
      });
    },
  );

  test(
    'the declined card says so and adds nothing',
    { tag: ['@regression', '@p1', '@REQ-PAY-02'] },
    async ({ walletPage, topMenu }) => {
      await walletPage.goto();
      await walletPage.startAdding('$5,000');
      await walletPage.paymentFrame.payWith(TEST_CARDS.declined);

      await expect(walletPage.paymentFrame.result).toHaveText(TEXT.payment.declined);
      // A card that was turned down leaves the step open, so another can be tried.
      await expect(walletPage.payStep).toBeVisible();
      await expect(walletPage.addMessage).toBeEmpty();
      await expect(walletPage.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
      await expect(topMenu.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
      await expect(walletPage.historyRows()).toHaveCount(TRADER.start.history.length);
    },
  );

  test(
    'the card with no funds says so and adds nothing',
    { tag: ['@regression', '@p1', '@REQ-PAY-02'] },
    async ({ walletPage, topMenu }) => {
      await walletPage.goto();
      await walletPage.startAdding('$5,000');
      await walletPage.paymentFrame.payWith(TEST_CARDS.noFunds);

      await expect(walletPage.paymentFrame.result).toHaveText(TEXT.payment.noFunds);
      await expect(walletPage.payStep).toBeVisible();
      await expect(walletPage.addMessage).toBeEmpty();
      await expect(walletPage.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
      await expect(topMenu.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
      await expect(walletPage.historyRows()).toHaveCount(TRADER.start.history.length);
    },
  );

  test(
    'a 16-digit card the app has never heard of is turned away',
    {
      tag: ['@regression', '@p2', '@REQ-PAY-02'],
    },
    async ({ walletPage }) => {
      await walletPage.goto();
      await walletPage.startAdding('$5,000');
      await walletPage.paymentFrame.payWith(UNKNOWN_CARD);

      // The number is a fine 16 digits, so no field complains: it is the card
      // itself the app does not know.
      await expect(walletPage.paymentFrame.result).toHaveText(TEXT.payment.unknownCard);
      await expect(walletPage.paymentFrame.numberError).toBeEmpty();
      await expect(walletPage.payStep).toBeVisible();
      await expect(walletPage.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
    },
  );
});

/**
 * One bad value per field, each with the message that field is meant to give.
 * Everything else on the card is good, so only the named field can fail.
 */
const BAD_FIELDS: readonly {
  readonly field: CardField;
  readonly name: string;
  readonly value: string;
  readonly message: string;
}[] = [
  { field: 'name', name: 'no name on the card', value: '', message: TEXT.payment.nameMissing },
  {
    field: 'number',
    name: 'a card number that is too short',
    value: '4242',
    message: TEXT.payment.numberBad,
  },
  {
    field: 'expiry',
    name: 'a month that does not exist',
    value: '13/30',
    message: TEXT.payment.expiryBad,
  },
  { field: 'cvc', name: 'a two-digit CVC', value: '12', message: TEXT.payment.cvcBad },
];

test.describe('The card form checks every field', () => {
  test.use({ storageState: TRADER.storageState });

  for (const bad of BAD_FIELDS) {
    test(
      `${bad.name} stops the payment`,
      { tag: ['@regression', '@p2', '@REQ-PAY-03'] },
      async ({ walletPage }) => {
        await walletPage.goto();
        await walletPage.startAdding('$5,000');

        const frame = walletPage.paymentFrame;
        await frame.fillCard({ ...GOOD_CARD, [bad.field]: bad.value });
        await frame.pay();

        await expect(frame.fieldError(bad.field)).toHaveText(bad.message);
        await expect(frame.field(bad.field)).toHaveAttribute('aria-invalid', 'true');

        await test.step('the other three fields are left alone', async () => {
          for (const other of BAD_FIELDS) {
            if (other.field === bad.field) continue;
            await expect(frame.fieldError(other.field)).toBeEmpty();
          }
        });

        await test.step('nothing was charged and nothing was added', async () => {
          // A form that fails its checks never starts the processing timer.
          await expect(frame.payButton).toBeVisible();
          await expect(frame.processingButton).toBeHidden();
          await expect(frame.result).toBeEmpty();
          await expect(walletPage.addMessage).toBeEmpty();
          await expect(walletPage.cash).toHaveAttribute(
            'data-cents',
            String(TRADER.start.cashCents),
          );
        });
      },
    );
  }
});

test.describe('While a card is being processed', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    '"Processing…" lasts exactly two seconds, and only then does the money arrive',
    {
      tag: ['@regression', '@p2', '@REQ-PAY-01'],
    },
    async ({ walletPage, page }) => {
      const cashAfterCents = TRADER.start.cashCents + FIVE_THOUSAND;

      await walletPage.goto();
      await walletPage.startAdding('$5,000');

      const frame = walletPage.paymentFrame;
      await frame.fillCard({ ...GOOD_CARD, number: TEST_CARDS.works });
      await frame.pay();

      await test.step('the button says Processing… and nothing has happened yet', async () => {
        await expect(frame.processingButton).toBeVisible();
        await expect(frame.processingButton).toBeDisabled();
        await expect(walletPage.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
        await expect(walletPage.addMessage).toBeEmpty();
      });

      await test.step('a millisecond before the two seconds are up, it is still waiting', async () => {
        await page.clock.runFor(PROCESSING_MS - 1);
        await expect(frame.processingButton).toBeVisible();
        await expect(walletPage.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
      });

      await test.step('the last millisecond finishes it', async () => {
        await page.clock.runFor(1);
        await expect(walletPage.addMessage).toHaveText(
          addedWithCard('$5,000', PAYING_CARD_LAST4, money(cashAfterCents)),
        );
        await expect(walletPage.cash).toHaveAttribute('data-cents', String(cashAfterCents));
        await expect(walletPage.payStep).toBeHidden();
      });
    },
  );
});

test.describe('When a top-up is refused before the card form', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'an amount over the $50,000 limit never opens the card form',
    {
      tag: ['@regression', '@p1', '@REQ-PAY-04', '@REQ-WALLET-02'],
    },
    async ({ accountState, walletPage }) => {
      // $45,000 added already, so $10,000 more is $5,000 too much.
      const addedCents = 4_500_000;
      const leftCents = ADD_LIMIT_CENTS - addedCents;
      await accountState.forUser(TRADER).withCash(addedCents).withNoHoldings().apply();

      await walletPage.goto();
      await accountState.expectApplied();

      await walletPage.startAdding('$10,000');

      await expect(walletPage.addError).toHaveText(addLimitLeft(money(leftCents)));
      await expect(walletPage.payStep).toBeHidden();
      await expect(walletPage.addMessage).toBeEmpty();
      await expect(walletPage.cash).toHaveAttribute('data-cents', String(addedCents));
    },
  );

  test(
    'Cancel closes the card step and adds nothing',
    { tag: ['@regression', '@p2', '@REQ-PAY-04'] },
    async ({ walletPage, topMenu }) => {
      await walletPage.goto();
      await walletPage.startAdding('$5,000');
      await expect(walletPage.payStep).toBeVisible();

      await walletPage.cancelPayment();

      await expect(walletPage.payStep).toBeHidden();
      await expect(walletPage.addMessage).toBeEmpty();
      await expect(walletPage.addError).toBeEmpty();
      await expect(walletPage.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
      await expect(topMenu.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
      await expect(walletPage.historyRows()).toHaveCount(TRADER.start.history.length);
    },
  );
});

test.describe('The Wallet only listens to its own payment frame', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'a message from another origin, or of another kind, adds nothing',
    {
      tag: ['@regression', '@p2', '@REQ-PAY-04'],
    },
    async ({ walletPage, topMenu, page }) => {
      await walletPage.goto();
      // The step has to be open, or the Wallet ignores every message anyway and
      // the test would pass without proving a thing.
      await walletPage.startAdding('$5,000');
      await expect(walletPage.payStep).toBeVisible();

      await test.step('a perfect payment message from somewhere else is ignored', async () => {
        await page.evaluate((amountCents) => {
          window.dispatchEvent(
            new MessageEvent('message', {
              origin: 'https://not-tradeloom.example.com',
              data: { type: 'tradeloom-payment', status: 'paid', amountCents, last4: '4242' },
            }),
          );
        }, FIVE_THOUSAND);

        await expect(walletPage.addMessage).toBeEmpty();
        await expect(walletPage.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
      });

      await test.step('a message of another kind from this very page is ignored too', async () => {
        await page.evaluate((amountCents) => {
          window.dispatchEvent(
            new MessageEvent('message', {
              origin: window.location.origin,
              data: { type: 'something-else-entirely', status: 'paid', amountCents, last4: '4242' },
            }),
          );
        }, FIVE_THOUSAND);

        await expect(walletPage.addMessage).toBeEmpty();
        await expect(walletPage.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
      });

      // The step is still waiting for a real card, and nothing was written.
      await expect(walletPage.payStep).toBeVisible();
      await expect(topMenu.cash).toHaveAttribute('data-cents', String(TRADER.start.cashCents));
      await expect(walletPage.historyRows()).toHaveCount(TRADER.start.history.length);
    },
  );
});
