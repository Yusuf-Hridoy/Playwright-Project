// The pop-up messages in the bottom corner. A fired price alert shows one,
// and the app closes it again 5 seconds later with setTimeout, so a test moves
// the clock with page.clock.runFor() instead of waiting.

import type { Locator, Page } from '@playwright/test';

export class Toast {
  readonly root: Locator;
  /** Every open pop-up. */
  readonly all: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId('toast-area');
    this.all = this.root.getByTestId('toast');
  }

  /**
   * The pop-up for one stock. The app marks each one with its symbol, and the
   * pop-up holds both its title line and its detail line, so a test checks the
   * text on this one locator.
   */
  bySymbol(symbol: string): Locator {
    return this.all.and(this.page.locator(`[data-symbol="${symbol}"]`));
  }

  async count(): Promise<number> {
    return this.all.count();
  }

  /** Closes one pop-up with its × button. */
  async close(symbol: string): Promise<void> {
    await this.bySymbol(symbol).getByTestId('toast-close').click();
  }
}
