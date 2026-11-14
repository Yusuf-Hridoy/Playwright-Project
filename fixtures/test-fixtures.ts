// The test object every spec imports. Nothing imports @playwright/test directly,
// so the clock, the page objects and the state builder are always in place.

import { test as base, expect } from '@playwright/test';
import { MARKET_OPEN_TIME } from '../config/test-settings';
import { LoginPage } from '../pages/login-page';
import { MarketPage } from '../pages/market-page';
import { StockPage } from '../pages/stock-page';
import { PortfolioPage } from '../pages/portfolio-page';
import { WalletPage } from '../pages/wallet-page';
import { WatchlistPage } from '../pages/watchlist-page';
import { ProfilePage } from '../pages/profile-page';
import { RulesPage } from '../pages/rules-page';
import { ReceiptPage } from '../pages/receipt-page';
import { TopMenu } from '../components/top-menu';
import { AccountStateBuilder } from '../builders/account-state-builder';

/** How far before the frozen moment the clock is installed. See frozenClock. */
const CLOCK_HEAD_START_MS = 5 * 60 * 1_000;

export interface TradeloomOptions {
  /**
   * The moment every test starts at. Prices repeat from it, so two runs on two
   * machines see the same figures.
   */
  marketTime: string;

  /**
   * Shuts the market. The market is open all day, every day now, and the only
   * thing that closes it is ?market=closed on the link. Turning this on makes
   * every page a page object opens carry that switch:
   *
   *   test.use({ marketClosed: true });
   */
  marketClosed: boolean;
}

export interface TradeloomFixtures {
  loginPage: LoginPage;
  marketPage: MarketPage;
  stockPage: StockPage;
  portfolioPage: PortfolioPage;
  walletPage: WalletPage;
  watchlistPage: WatchlistPage;
  profilePage: ProfilePage;
  rulesPage: RulesPage;
  /** One receipt. Usually reached through WalletPage.openReceipt() instead. */
  receiptPage: ReceiptPage;
  topMenu: TopMenu;
  accountState: AccountStateBuilder;
  /** Freezes the clock. Nothing uses it directly; it runs on its own. */
  frozenClock: void;
}

export const test = base.extend<TradeloomOptions & TradeloomFixtures>({
  marketTime: [MARKET_OPEN_TIME, { option: true }],
  marketClosed: [false, { option: true }],

  // Prices move with the clock, and so do the alert checker, the card step's
  // processing timer and every pop-up. Standing the clock still is what makes
  // two runs on two machines agree. Time only moves when a test calls
  // page.clock.runFor().
  frozenClock: [
    async ({ page, marketTime }, use) => {
      const moment = new Date(marketTime);

      // install() starts a clock that then ticks along in real time, so by the
      // time pauseAt() runs it is already a few milliseconds past. Asking it to
      // pause at a moment it has gone by is an error ("Cannot fast-forward to
      // the past"), and Firefox is slow enough between the two calls to hit it.
      // Starting five minutes early leaves room for any browser. Nothing is on
      // screen yet, so those five minutes are never seen by anyone.
      await page.clock.install({ time: new Date(moment.getTime() - CLOCK_HEAD_START_MS) });
      await page.clock.pauseAt(moment);
      await use();
    },
    { auto: true },
  ],

  loginPage: async ({ page, marketClosed }, use) => {
    await use(new LoginPage(page, { marketClosed }));
  },

  marketPage: async ({ page, marketClosed }, use) => {
    await use(new MarketPage(page, { marketClosed }));
  },

  stockPage: async ({ page, marketClosed }, use) => {
    await use(new StockPage(page, { marketClosed }));
  },

  portfolioPage: async ({ page, marketClosed }, use) => {
    await use(new PortfolioPage(page, { marketClosed }));
  },

  walletPage: async ({ page, marketClosed }, use) => {
    await use(new WalletPage(page, { marketClosed }));
  },

  watchlistPage: async ({ page, marketClosed }, use) => {
    await use(new WatchlistPage(page, { marketClosed }));
  },

  profilePage: async ({ page, marketClosed }, use) => {
    await use(new ProfilePage(page, { marketClosed }));
  },

  rulesPage: async ({ page, marketClosed }, use) => {
    await use(new RulesPage(page, { marketClosed }));
  },

  receiptPage: async ({ page, marketClosed }, use) => {
    await use(new ReceiptPage(page, { marketClosed }));
  },

  topMenu: async ({ page }, use) => {
    await use(new TopMenu(page));
  },

  accountState: async ({ page }, use) => {
    await use(new AccountStateBuilder(page));
  },
});

export { expect };
