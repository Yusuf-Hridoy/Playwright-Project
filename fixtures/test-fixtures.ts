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
import { RulesPage } from '../pages/rules-page';
import { TopMenu } from '../components/top-menu';
import { AccountStateBuilder } from '../builders/account-state-builder';

export interface TradeloomOptions {
  /**
   * The moment every test starts at. The default is a Monday morning with the
   * market open. A spec that wants the market shut says so:
   *
   *   test.use({ marketTime: MARKET_CLOSED_TIME });
   */
  marketTime: string;
}

export interface TradeloomFixtures {
  loginPage: LoginPage;
  marketPage: MarketPage;
  stockPage: StockPage;
  portfolioPage: PortfolioPage;
  walletPage: WalletPage;
  watchlistPage: WatchlistPage;
  rulesPage: RulesPage;
  topMenu: TopMenu;
  accountState: AccountStateBuilder;
  /** Freezes the clock. Nothing uses it directly; it runs on its own. */
  frozenClock: void;
}

export const test = base.extend<TradeloomOptions & TradeloomFixtures>({
  marketTime: [MARKET_OPEN_TIME, { option: true }],

  // Prices move with the clock, and so do the market status, the alert checker
  // and every pop-up timer. Standing the clock still is what makes two runs on
  // two machines agree. Time only moves when a test calls page.clock.runFor().
  frozenClock: [
    async ({ page, marketTime }, use) => {
      const moment = new Date(marketTime);
      await page.clock.install({ time: moment });
      await page.clock.pauseAt(moment);
      await use();
    },
    { auto: true },
  ],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  marketPage: async ({ page }, use) => {
    await use(new MarketPage(page));
  },

  stockPage: async ({ page }, use) => {
    await use(new StockPage(page));
  },

  portfolioPage: async ({ page }, use) => {
    await use(new PortfolioPage(page));
  },

  walletPage: async ({ page }, use) => {
    await use(new WalletPage(page));
  },

  watchlistPage: async ({ page }, use) => {
    await use(new WatchlistPage(page));
  },

  rulesPage: async ({ page }, use) => {
    await use(new RulesPage(page));
  },

  topMenu: async ({ page }, use) => {
    await use(new TopMenu(page));
  },

  accountState: async ({ page }, use) => {
    await use(new AccountStateBuilder(page));
  },
});

export { expect };
