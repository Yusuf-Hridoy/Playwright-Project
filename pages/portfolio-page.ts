// The Portfolio page: four number cards and a row for every stock owned.

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import type { PageObjectOptions } from './base-page';
import { TEXT } from '../data/expected-text';
import { centsOf } from '../utils/money';

export type HoldingSort = 'gain' | 'value' | 'name';

export class PortfolioPage extends BasePage {
  readonly heading: Locator;

  /** The four cards along the top. Each one carries its exact data-cents. */
  readonly totalWorth: Locator;
  readonly cash: Locator;
  readonly stocksWorth: Locator;
  readonly totalGain: Locator;

  readonly sortSelect: Locator;
  readonly emptyMessage: Locator;

  constructor(page: Page, options: PageObjectOptions = {}) {
    super(page, options);
    this.heading = page.getByRole('heading', { name: TEXT.portfolio.title });

    this.totalWorth = page.getByTestId('stat-total-worth');
    this.cash = page.getByTestId('stat-cash');
    this.stocksWorth = page.getByTestId('stat-stocks-worth');
    this.totalGain = page.getByTestId('stat-total-gain');

    this.sortSelect = page.getByLabel(TEXT.portfolio.sortLabel);
    this.emptyMessage = page.getByTestId('portfolio-empty');
  }

  protected override readyElement(): Locator {
    return this.heading;
  }

  /**
   * The four cards are drawn empty and filled once the prices arrive. Total
   * gain is the last one filled, so waiting for it means the rows are ready too.
   */
  override async waitUntilReady(): Promise<void> {
    await super.waitUntilReady();
    await expect(this.totalGain).not.toHaveText(TEXT.common.placeholder);
  }

  async goto(): Promise<void> {
    await this.open('portfolio');
  }

  /** Asks for the Portfolio page without a session, so the app sends us to log in. */
  async gotoExpectingLogin(): Promise<void> {
    await this.openWithoutWaiting('portfolio');
  }

  /** One holding's row, found by the symbol the app marks it with. */
  row(symbol: string): Locator {
    return this.page.getByTestId('holding-row').and(this.page.locator(`[data-symbol="${symbol}"]`));
  }

  allRows(): Locator {
    return this.page.getByTestId('holding-row');
  }

  shares(symbol: string): Locator {
    return this.row(symbol).getByTestId('holding-shares');
  }

  price(symbol: string): Locator {
    return this.row(symbol).getByTestId('holding-price');
  }

  worth(symbol: string): Locator {
    return this.row(symbol).getByTestId('holding-worth');
  }

  gain(symbol: string): Locator {
    return this.row(symbol).getByTestId('holding-gain');
  }

  async priceCents(symbol: string): Promise<number> {
    return centsOf(this.price(symbol));
  }

  async worthCents(symbol: string): Promise<number> {
    return centsOf(this.worth(symbol));
  }

  async totalWorthCents(): Promise<number> {
    return centsOf(this.totalWorth);
  }

  async cashCents(): Promise<number> {
    return centsOf(this.cash);
  }

  async sortBy(how: HoldingSort): Promise<void> {
    await this.sortSelect.selectOption(how);
  }

  /** The symbols of the rows, in the order the table shows them. */
  async order(): Promise<string[]> {
    return this.allRows().evaluateAll((rows) => rows.map((row) => row.getAttribute('data-symbol') ?? ''));
  }
}
