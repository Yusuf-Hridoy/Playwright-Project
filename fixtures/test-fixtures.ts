// The test object every spec imports. Nothing imports @playwright/test directly,
// so the clock, the page objects and the state builder are always in place.

import { test as base, expect } from '@playwright/test';
import { MARKET_OPEN_TIME, SEED } from '../config/test-settings';
import { LoginPage } from '../pages/login-page';
import { MarketPage } from '../pages/market-page';
import { StockPage } from '../pages/stock-page';
import { PortfolioPage } from '../pages/portfolio-page';
import { WalletPage } from '../pages/wallet-page';
import { WatchlistPage } from '../pages/watchlist-page';
import { NewsPage } from '../pages/news-page';
import { ProfilePage } from '../pages/profile-page';
import { RulesPage } from '../pages/rules-page';
import { ReceiptPage } from '../pages/receipt-page';
import { TopMenu } from '../components/top-menu';
import { AccountStateBuilder } from '../builders/account-state-builder';
import { registerPopupHandlers } from './popup-handlers';
import { freezeClock } from '../utils/frozen-clock';
import type { AppSwitches, BugName, DriftName } from '../utils/app-paths';

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

  /**
   * The app's bugs to switch on, like ['cost']. Each one makes the app get one
   * sum wrong on purpose. Only the bug hunt uses these:
   *
   *   test.use({ bugs: ['cost'] });
   */
  bugs: readonly BugName[];

  /**
   * The app pretends to be a newer version: ['text'] renames labels, ['ids']
   * changes every test id, ['layout'] moves three parts of the page and
   * ['popup'] adds a cookie banner and a Pro dialog. Popup handlers are only
   * registered when 'popup' is in the list.
   */
  drift: readonly DriftName[];

  /** Makes every data load in the app wait this long. 0 is off. */
  slowMs: number;

  /** Makes about one data load in three fail, decided by the seed. */
  flaky: boolean;

  /** The app's ?seed. Prices, news and flaky failures all repeat from it. */
  seed: string;
}

export interface TradeloomFixtures {
  loginPage: LoginPage;
  marketPage: MarketPage;
  stockPage: StockPage;
  portfolioPage: PortfolioPage;
  walletPage: WalletPage;
  watchlistPage: WatchlistPage;
  newsPage: NewsPage;
  profilePage: ProfilePage;
  rulesPage: RulesPage;
  /** One receipt. Usually reached through WalletPage.openReceipt() instead. */
  receiptPage: ReceiptPage;
  topMenu: TopMenu;
  accountState: AccountStateBuilder;
  /** Freezes the clock. Nothing uses it directly; it runs on its own. */
  frozenClock: void;
  /**
   * The five options above, gathered into the one shape every page object
   * takes. utils/app-paths.ts turns it into the query the app reads.
   */
  appSwitches: AppSwitches;
  /** Closes the drift popups. Nothing uses it directly; it runs on its own. */
  popupHandlers: void;
}

export const test = base.extend<TradeloomOptions & TradeloomFixtures>({
  marketTime: [MARKET_OPEN_TIME, { option: true }],
  marketClosed: [false, { option: true }],
  bugs: [[], { option: true }],
  drift: [[], { option: true }],
  slowMs: [0, { option: true }],
  flaky: [false, { option: true }],
  seed: [SEED, { option: true }],

  // One place turns the options into switches, so no page object builds a
  // link of its own and nothing can drift apart.
  appSwitches: async ({ bugs, drift, slowMs, flaky, seed }, use) => {
    await use({ bugs, drift, slowMs, flaky, seed });
  },

  // Only tests that asked for drift=popup get the handlers. Everywhere else a
  // popup that turns up on its own should fail the test it interrupted,
  // because it would mean the app really changed.
  popupHandlers: [
    async ({ page, drift }, use) => {
      if (drift.includes('popup')) await registerPopupHandlers(page);
      await use();
    },
    { auto: true },
  ],

  // Prices move with the clock, and so do the alert checker, the card step's
  // processing timer and every pop-up. Standing the clock still is what makes
  // two runs on two machines agree. Time only moves when a test calls
  // page.clock.runFor().
  frozenClock: [
    async ({ page, marketTime }, use) => {
      await freezeClock(page, marketTime);
      await use();
    },
    { auto: true },
  ],

  loginPage: async ({ page, marketClosed, appSwitches }, use) => {
    await use(new LoginPage(page, { marketClosed, switches: appSwitches }));
  },

  marketPage: async ({ page, marketClosed, appSwitches }, use) => {
    await use(new MarketPage(page, { marketClosed, switches: appSwitches }));
  },

  stockPage: async ({ page, marketClosed, appSwitches }, use) => {
    await use(new StockPage(page, { marketClosed, switches: appSwitches }));
  },

  portfolioPage: async ({ page, marketClosed, appSwitches }, use) => {
    await use(new PortfolioPage(page, { marketClosed, switches: appSwitches }));
  },

  walletPage: async ({ page, marketClosed, appSwitches }, use) => {
    await use(new WalletPage(page, { marketClosed, switches: appSwitches }));
  },

  watchlistPage: async ({ page, marketClosed, appSwitches }, use) => {
    await use(new WatchlistPage(page, { marketClosed, switches: appSwitches }));
  },

  newsPage: async ({ page, marketClosed, appSwitches }, use) => {
    await use(new NewsPage(page, { marketClosed, switches: appSwitches }));
  },

  profilePage: async ({ page, marketClosed, appSwitches }, use) => {
    await use(new ProfilePage(page, { marketClosed, switches: appSwitches }));
  },

  rulesPage: async ({ page, marketClosed, appSwitches }, use) => {
    await use(new RulesPage(page, { marketClosed, switches: appSwitches }));
  },

  receiptPage: async ({ page, marketClosed, appSwitches }, use) => {
    await use(new ReceiptPage(page, { marketClosed, switches: appSwitches }));
  },

  topMenu: async ({ page }, use) => {
    await use(new TopMenu(page));
  },

  accountState: async ({ page }, use) => {
    await use(new AccountStateBuilder(page));
  },
});

export { expect };
