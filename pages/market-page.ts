// The Market page: three number cards, a search box, four filters and a row
// for every stock.

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { StockRow } from '../components/stock-row';
import { TEXT } from '../data/expected-text';

export class MarketPage extends BasePage {
  readonly table: Locator;

  /** The three cards along the top. Each one carries its exact data-cents. */
  readonly totalWorth: Locator;
  readonly todayChange: Locator;
  readonly cash: Locator;

  readonly searchBox: Locator;
  readonly clearSearchButton: Locator;

  readonly allFilter: Locator;
  readonly upFilter: Locator;
  readonly downFilter: Locator;
  readonly ownedFilter: Locator;

  /** The box that shows up when no row is left to show. */
  readonly emptyMessage: Locator;
  readonly closedBanner: Locator;
  readonly watchlistFullError: Locator;

  constructor(page: Page) {
    super(page);
    this.table = page.getByTestId('market-table');

    this.totalWorth = page.getByTestId('stat-total-worth');
    this.todayChange = page.getByTestId('stat-today');
    this.cash = page.getByTestId('stat-cash');

    this.searchBox = page.getByLabel(TEXT.market.searchLabel);
    this.clearSearchButton = page.getByRole('button', { name: TEXT.market.clearSearch });

    this.allFilter = page.getByRole('button', { name: TEXT.market.filterAll });
    this.upFilter = page.getByRole('button', { name: TEXT.market.filterUp });
    this.downFilter = page.getByRole('button', { name: TEXT.market.filterDown });
    this.ownedFilter = page.getByRole('button', { name: TEXT.market.filterOwned });

    this.emptyMessage = page.getByTestId('market-empty');
    this.closedBanner = page.getByTestId('market-closed-banner');
    this.watchlistFullError = page.getByTestId('watchlist-full-error');
  }

  protected override readyElement(): Locator {
    return this.table;
  }

  /**
   * The table is put on the page before the prices are worked out, so every
   * figure reads "-" for a moment. The cash card is the last thing each refresh
   * fills in, so waiting for it means every row is filled in too.
   */
  override async waitUntilReady(): Promise<void> {
    await super.waitUntilReady();
    await expect(this.cash).not.toHaveText(TEXT.common.placeholder);
  }

  async goto(): Promise<void> {
    await this.open('market');
  }

  /** Asks for the Market page without a session, so the app sends us to log in. */
  async gotoExpectingLogin(): Promise<void> {
    await this.openWithoutWaiting('market');
  }

  /** One stock's row, as a component. */
  row(symbol: string): StockRow {
    return new StockRow(this.page, symbol);
  }

  /** Every row. Rows hidden by a filter still count here. */
  allRows(): Locator {
    return this.page.getByTestId('market-row');
  }

  /** Only the rows a person can actually see right now. */
  visibleRows(): Locator {
    return this.allRows().filter({ visible: true });
  }

  /** The symbols of the visible rows, in the order the table shows them. */
  async visibleSymbols(): Promise<string[]> {
    const symbols = await this.visibleRows().evaluateAll((rows) =>
      rows.map((row) => row.getAttribute('data-symbol') ?? ''),
    );
    return symbols;
  }

  async search(text: string): Promise<void> {
    await this.searchBox.fill(text);
  }

  async showOnlyOwned(): Promise<void> {
    await this.ownedFilter.click();
  }
}
