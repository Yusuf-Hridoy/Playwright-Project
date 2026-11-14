// The bar at the top of every signed-in page: links, market status and cash.
// Components expose locators and do actions. They never assert.

import type { Locator, Page } from '@playwright/test';
import { TEXT } from '../data/expected-text';
import { centsOf } from '../utils/money';

export class TopMenu {
  readonly root: Locator;

  readonly marketLink: Locator;
  readonly portfolioLink: Locator;
  readonly watchlistLink: Locator;
  readonly walletLink: Locator;
  readonly rulesLink: Locator;
  /** The circle on the right: the photo, or the initials of the display name. */
  readonly profileLink: Locator;

  /** The "Market open" / "Market closed" pill. */
  readonly marketStatus: Locator;
  /** The cash box. Its data-cents attribute holds the exact amount. */
  readonly cash: Locator;
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId('top-menu');

    this.marketLink = this.root.getByRole('link', { name: TEXT.menu.market, exact: true });
    this.portfolioLink = this.root.getByRole('link', { name: TEXT.menu.portfolio, exact: true });
    this.watchlistLink = this.root.getByRole('link', { name: TEXT.menu.watchlist, exact: true });
    this.walletLink = this.root.getByRole('link', { name: TEXT.menu.wallet, exact: true });
    this.rulesLink = this.root.getByRole('link', { name: TEXT.menu.rules, exact: true });

    this.profileLink = this.root.getByTestId('menu-link-profile');

    this.marketStatus = this.root.getByTestId('market-status');
    this.cash = this.root.getByTestId('menu-cash');
    this.logoutButton = this.root.getByRole('button', { name: TEXT.menu.logout });
  }

  /** The money text only, without the "Cash" label beside it. */
  cashValue(): Locator {
    return this.cash.getByText(/\$/);
  }

  /** The exact cash in whole cents, read from the app's own data-cents. */
  async cashCents(): Promise<number> {
    return centsOf(this.cash);
  }

  async logOut(): Promise<void> {
    await this.logoutButton.click();
  }

  async goToPortfolio(): Promise<void> {
    await this.portfolioLink.click();
  }

  async goToMarket(): Promise<void> {
    await this.marketLink.click();
  }

  async goToWatchlist(): Promise<void> {
    await this.watchlistLink.click();
  }

  async goToWallet(): Promise<void> {
    await this.walletLink.click();
  }

  async goToProfile(): Promise<void> {
    await this.profileLink.click();
  }

  /** The photo in the circle. There is none while the initials are showing. */
  profilePhoto(): Locator {
    return this.profileLink.locator('img');
  }

  /** The page this menu belongs to, for the odd test that needs it. */
  owner(): Page {
    return this.page;
  }
}
