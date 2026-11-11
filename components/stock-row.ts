// One row of the Market table, found by the symbol the app marks it with.

import type { Locator, Page } from '@playwright/test';
import { centsOf } from '../utils/money';

export class StockRow {
  readonly root: Locator;

  /** Today's price. Its data-cents attribute holds the exact amount. */
  readonly price: Locator;
  /** Today's move, like "+1.2% ▲". */
  readonly change: Locator;
  /** "20 shares", or "-" when none are owned. */
  readonly owned: Locator;
  /** The ☆ / ★ button that puts the stock on the watchlist. */
  readonly watchStar: Locator;
  readonly tradeLink: Locator;

  constructor(page: Page, readonly symbol: string) {
    // data-symbol is how the app labels each row. Pairing it with the test id
    // keeps the lookup on app data, with no class names and no XPath.
    this.root = page.getByTestId('market-row').and(page.locator(`[data-symbol="${symbol}"]`));

    this.price = this.root.getByTestId('row-price');
    this.change = this.root.getByTestId('row-change');
    this.owned = this.root.getByTestId('row-owned');
    this.watchStar = this.root.getByTestId('watch-star');
    this.tradeLink = this.root.getByTestId('row-trade');
  }

  async priceCents(): Promise<number> {
    return centsOf(this.price);
  }

  /** Opens this stock's own page, on the Buy tab. */
  async openTrade(): Promise<void> {
    await this.tradeLink.click();
  }

  async toggleWatch(): Promise<void> {
    await this.watchStar.click();
  }

  /** True while the stock is on the watchlist, read from the star's state. */
  async isWatched(): Promise<boolean> {
    return (await this.watchStar.getAttribute('aria-pressed')) === 'true';
  }
}
