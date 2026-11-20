// The bar at the top of every signed-in page: links, market status and cash.
// Components expose locators and do actions. They never assert.

import type { Locator, Page } from '@playwright/test';
import { TEXT } from '../data/expected-text';
import { LOG_OUT, MARKET_LINK, renamedTestId } from '../data/label-synonyms';
import { healing } from '../utils/healing-locator';
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
    // Everything else here is found inside the menu, so if the menu itself
    // cannot be found nothing in it can be either.
    this.root = healing({
      where: 'TopMenu',
      element: 'the menu itself',
      ways: [
        { how: 'test id top-menu', locator: page.getByTestId('top-menu') },
        { how: 'renamed test id top-menu', locator: page.getByTestId(renamedTestId('top-menu')) },
      ],
    });

    // The menu is on every signed-in page, so these are the links the whole
    // suite leans on. Market, cash and log out are the three the app renames.
    this.marketLink = healing({
      where: 'TopMenu',
      element: 'Market link',
      ways: [
        { how: 'role link named Market', locator: this.root.getByRole('link', { name: TEXT.menu.market, exact: true }) },
        { how: 'role link named market or stocks', locator: this.root.getByRole('link', { name: MARKET_LINK }) },
      ],
    });
    this.portfolioLink = healing({
      where: 'TopMenu',
      element: 'Portfolio link',
      ways: [
        { how: 'role link named Portfolio', locator: this.root.getByRole('link', { name: TEXT.menu.portfolio, exact: true }) },
        { how: 'renamed test id menu-link-portfolio', locator: this.root.getByTestId(renamedTestId('menu-link-portfolio')) },
      ],
    });
    this.watchlistLink = this.root.getByRole('link', { name: TEXT.menu.watchlist, exact: true });
    this.walletLink = healing({
      where: 'TopMenu',
      element: 'Wallet link',
      ways: [
        { how: 'role link named Wallet', locator: this.root.getByRole('link', { name: TEXT.menu.wallet, exact: true }) },
        { how: 'renamed test id menu-link-wallet', locator: this.root.getByTestId(renamedTestId('menu-link-wallet')) },
      ],
    });
    this.rulesLink = this.root.getByRole('link', { name: TEXT.menu.rules, exact: true });

    this.profileLink = this.root.getByTestId('menu-link-profile');

    this.marketStatus = this.root.getByTestId('market-status');
    this.cash = healing({
      where: 'TopMenu',
      element: 'cash box',
      ways: [
        { how: 'test id menu-cash', locator: this.root.getByTestId('menu-cash') },
        // The box is a link to the Wallet, and the word Cash starts its name.
        { how: 'role link whose name starts with Cash', locator: this.root.getByRole('link', { name: new RegExp(`^${TEXT.menu.cash}`) }) },
      ],
    });
    this.logoutButton = healing({
      where: 'TopMenu',
      element: 'log out button',
      ways: [
        { how: 'role button named Log out', locator: this.root.getByRole('button', { name: TEXT.menu.logout }) },
        { how: 'role button named log out or sign out', locator: this.root.getByRole('button', { name: LOG_OUT }) },
      ],
    });
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
