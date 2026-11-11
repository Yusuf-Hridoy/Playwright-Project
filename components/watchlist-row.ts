// One row of the Watchlist, found by the symbol the app marks it with.
// Rows can be reordered by dragging, or from the keyboard on the drag handle.

import type { Locator, Page } from '@playwright/test';
import { centsOf } from '../utils/money';

export class WatchlistRow {
  readonly root: Locator;

  /** The ⋮⋮ grip. Arrow keys on it move the row. */
  readonly dragHandle: Locator;
  /** Today's price. Its data-cents attribute holds the exact amount. */
  readonly price: Locator;
  readonly change: Locator;
  /** "No alert", "Above $55.00" or "Hit at 10:05". */
  readonly alertStatus: Locator;
  readonly alertButton: Locator;
  readonly removeButton: Locator;

  constructor(page: Page, readonly symbol: string) {
    this.root = page.getByTestId('watchlist-row').and(page.locator(`[data-symbol="${symbol}"]`));

    this.dragHandle = this.root.getByTestId('watchlist-drag-handle');
    this.price = this.root.getByTestId('watchlist-price');
    this.change = this.root.getByTestId('watchlist-change');
    this.alertStatus = this.root.getByTestId('watchlist-alert-status');
    this.alertButton = this.root.getByTestId('watchlist-alert-open');
    this.removeButton = this.root.getByTestId('watchlist-remove');
  }

  async priceCents(): Promise<number> {
    return centsOf(this.price);
  }

  /** Opens the alert editor beside the list for this stock. */
  async openAlert(): Promise<void> {
    await this.alertButton.click();
  }

  async remove(): Promise<void> {
    await this.removeButton.click();
  }

  /** Drags this row onto another one, which is how a person reorders the list. */
  async dragOnto(other: WatchlistRow): Promise<void> {
    await this.root.dragTo(other.root);
  }

  async moveUp(): Promise<void> {
    await this.dragHandle.focus();
    await this.dragHandle.press('ArrowUp');
  }

  async moveDown(): Promise<void> {
    await this.dragHandle.focus();
    await this.dragHandle.press('ArrowDown');
  }
}
