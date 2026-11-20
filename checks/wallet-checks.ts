// The Wallet check the everyday tests make, shared with the bug hunt.
// See checks/trading-checks.ts for why these live outside the specs.

import { expect } from '@playwright/test';
import type { WalletPage } from '../pages/wallet-page';
import type { DemoAccount } from '../data/demo-accounts';
import { ADD_CHOICES_CENTS, ADD_LIMIT_CENTS } from '../data/demo-accounts';
import { PAYING_CARD_LAST4 } from '../components/payment-frame';
import { addLimitReached, addedWithCard } from '../data/expected-text';
import { money } from '../utils/money';

/**
 * Tops the account up in $10,000 steps until $50,000 has been added in all,
 * then asks for one more. That one has to be turned away before the card step
 * even opens, with no money moving.
 *
 * The page is opened by the caller, so a test can set the account up first.
 *
 * Caught by: bug=limit, which quietly lets the account reach $60,000 while the
 * note beside it still says $50,000.
 */
export async function expectTopUpsStopAtTheLimit(
  walletPage: WalletPage,
  account: DemoAccount,
): Promise<void> {
  const stepCents = ADD_CHOICES_CENTS['10000'];
  let cashCents = account.start.cashCents;
  let addedCents = account.start.totalAddedCents;

  while (addedCents + stepCents <= ADD_LIMIT_CENTS) {
    cashCents += stepCents;
    addedCents += stepCents;

    await walletPage.addMoney('$10,000');

    await expect(walletPage.addMessage).toHaveText(
      addedWithCard('$10,000', PAYING_CARD_LAST4, money(cashCents)),
    );
    await expect(walletPage.cash).toHaveAttribute('data-cents', String(cashCents));
  }

  await walletPage.startAdding('$10,000');

  await expect(
    walletPage.addError,
    `${money(addedCents)} has been added in all, so the next top-up should be refused.`,
  ).toHaveText(addLimitReached());
  await expect(walletPage.payStep).toBeHidden();
  await expect(walletPage.cash).toHaveAttribute('data-cents', String(cashCents));
}
