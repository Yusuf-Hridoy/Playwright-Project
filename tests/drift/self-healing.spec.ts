// The app pretending to be a newer version, and the suite carrying on anyway.
//
// Every test here runs with all four drift switches on at once:
//   text    eleven labels are renamed: "Log in" becomes "Sign in", the trade
//           button becomes "Place buy order", and so on.
//   ids     every data-testid changes, so login-submit becomes tl-login_submit.
//   layout  the stat cards, the trade box and the Wallet link all move.
//   popup   a cookie banner and a "Try Tradeloom Pro" dialog turn up.
//
// Nothing below is written any differently because of that. The page objects
// carry backup locators (utils/healing-locator.ts), the popups are closed by
// handlers registered for this project only (fixtures/popup-handlers.ts), and
// every heal lands in heal-report/heal-report.md at the end of the run.
//
// These are the journeys that matter most: logging in, finding a stock,
// buying, selling, moving around, paying, and logging out again.

import { test, expect } from '../../fixtures/test-fixtures';
import { ADD_CHOICES_CENTS, NEWBIE, TRADER } from '../../data/demo-accounts';
import { TEST_CARDS } from '../../components/payment-frame';
import { TEXT, boughtTitle, sharesWord, soldTitle } from '../../data/expected-text';
import { COOKIE_DELAY_MS } from '../../fixtures/popup-handlers';

// All four at once. A test that survives the lot survives any one of them.
const ALL_DRIFT = ['text', 'ids', 'layout', 'popup'] as const;

test.describe('A signed-out visitor, on a drifted app', () => {
  test.use({ drift: ALL_DRIFT });

  test('logs in and lands on the Market page', { tag: ['@drift'] }, async ({
    loginPage,
    marketPage,
    topMenu,
  }) => {
    await loginPage.goto();

    await loginPage.logIn(TRADER.email, TRADER.password);

    await marketPage.waitUntilReady();
    await expect(topMenu.marketLink).toBeVisible();
    await expect(marketPage.table).toBeVisible();
  });
});

test.describe('A trader on a drifted app', () => {
  test.use({ storageState: TRADER.storageState, drift: ALL_DRIFT });

  test('searches for a stock and opens its page', { tag: ['@drift'] }, async ({
    marketPage,
    stockPage,
  }) => {
    await marketPage.goto();

    await marketPage.search('kryl');
    await marketPage.row('KRYL').openTrade();

    await stockPage.waitUntilReady();
    await expect(stockPage.symbolHeading).toHaveText('KRYL');
  });

  test('buys one KRYL and the menu cash drops by the price', { tag: ['@drift'] }, async ({
    stockPage,
    topMenu,
  }) => {
    await stockPage.goto('KRYL');

    const cashBefore = await topMenu.cashCents();
    const priceCents = await stockPage.priceCents();

    await stockPage.trade(1);

    await expect(stockPage.successTitle).toHaveText(boughtTitle(1, 'KRYL'));
    await expect(topMenu.cash).toHaveAttribute('data-cents', String(cashBefore - priceCents));
  });

  test('sells one LUMA and the menu cash goes up by the price', { tag: ['@drift'] }, async ({
    stockPage,
    topMenu,
  }) => {
    await stockPage.goto('LUMA', { mode: 'sell' });

    const cashBefore = await topMenu.cashCents();
    const priceCents = await stockPage.priceCents();

    await stockPage.trade(1);

    await expect(stockPage.successTitle).toHaveText(soldTitle(1, 'LUMA'));
    await expect(topMenu.cash).toHaveAttribute('data-cents', String(cashBefore + priceCents));
  });

  test('walks to Portfolio and Wallet through the top menu', { tag: ['@drift'] }, async ({
    page,
    marketPage,
    portfolioPage,
    walletPage,
    topMenu,
  }) => {
    await marketPage.goto();

    // The cookie banner is on a two second timer, and the clock is frozen, so
    // nothing has turned up yet. Moving the clock brings it out, and the
    // handler closes it on the way past.
    await page.clock.runFor(COOKIE_DELAY_MS);

    await topMenu.goToPortfolio();
    await portfolioPage.waitUntilReady();
    await expect(portfolioPage.heading).toBeVisible();

    await topMenu.goToWallet();
    await walletPage.waitUntilReady();
    await expect(walletPage.cash).toHaveAttribute('data-cents', /\d+/);
  });

  test('sees LUMA in the portfolio with the right number of shares', { tag: ['@drift'] }, async ({
    portfolioPage,
  }) => {
    await portfolioPage.goto();

    await expect(portfolioPage.shares('LUMA')).toHaveText(
      sharesWord(TRADER.start.holdings['LUMA']!.shares),
    );
  });

  test('logs out and lands back on the log in page', { tag: ['@drift'] }, async ({
    marketPage,
    loginPage,
    topMenu,
  }) => {

    await marketPage.goto();

    await topMenu.logOut();

    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.emailField).toBeEmpty();
  });
});

test.describe('A newbie topping up on a drifted app', () => {
  test.use({ storageState: NEWBIE.storageState, drift: ALL_DRIFT });

  test('adds $1,000 with card 4242 through the payment frame', { tag: ['@drift'] }, async ({
    walletPage,
  }) => {
    await walletPage.goto();

    const cashBefore = await walletPage.cashCents();

    await walletPage.startAdding('$1,000');
    await walletPage.paymentFrame.payWith(TEST_CARDS.works);

    await expect(walletPage.cash).toHaveAttribute(
      'data-cents',
      String(cashBefore + ADD_CHOICES_CENTS['1000']),
    );
  });
});

test.describe('The everyday app, for comparison', () => {
  test.use({ storageState: TRADER.storageState });

  test('needs no healing at all when nothing has drifted', { tag: ['@drift'] }, async ({
    marketPage,
    topMenu,
  }) => {
    await marketPage.goto();

    // The same journey as the first drift test, on a plain link. Every heal
    // this run records should come from the tests above, never from this one,
    // which is what the warning in the heal report is there to catch.
    await expect(topMenu.marketLink).toHaveText(TEXT.menu.market);
    await expect(marketPage.searchBox).toBeVisible();
    await expect(marketPage.table).toBeVisible();
  });
});
