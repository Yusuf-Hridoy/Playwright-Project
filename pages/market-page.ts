// The Market page: three number cards, a search box, four filters and a row
// for every stock.

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import type { PageObjectOptions } from './base-page';
import { NewsBox } from '../components/news-box';
import { StockRow } from '../components/stock-row';
import { TEXT } from '../data/expected-text';
import { SEARCH_STOCKS, renamedTestId } from '../data/label-synonyms';
import { healing } from '../utils/healing-locator';

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

  /** The grey bars that stand in for the rows while the prices are loading. */
  readonly loadingBox: Locator;
  readonly loadingBars: Locator;
  /** The "Couldn't load prices" box, and the button that tries again. */
  readonly errorBox: Locator;
  readonly retryButton: Locator;

  /** The news box under the table. Everything it shows is in a shadow root. */
  readonly newsBox: NewsBox;

  constructor(page: Page, options: PageObjectOptions = {}) {
    super(page, options);
    // The table is what says the page has finished drawing itself, so it
    // needs a backup way as much as anything a test clicks.
    this.table = healing({
      where: 'MarketPage',
      element: 'stock table',
      ways: [
        { how: 'test id market-table', locator: page.getByTestId('market-table') },
        { how: 'the only table on the page', locator: page.getByRole('table') },
      ],
    });
    this.newsBox = new NewsBox(page);

    this.totalWorth = page.getByTestId('stat-total-worth');
    this.todayChange = page.getByTestId('stat-today');
    this.cash = healing({
      where: 'MarketPage',
      element: 'cash card',
      ways: [
        { how: 'test id stat-cash', locator: page.getByTestId('stat-cash') },
        { how: 'renamed test id stat-cash', locator: page.getByTestId(renamedTestId('stat-cash')) },
      ],
    });

    this.searchBox = healing({
      where: 'MarketPage',
      element: 'search box',
      ways: [
        { how: 'label Search stocks', locator: page.getByLabel(TEXT.market.searchLabel) },
        { how: 'label search stocks or find a stock', locator: page.getByLabel(SEARCH_STOCKS) },
      ],
    });
    this.clearSearchButton = page.getByRole('button', { name: TEXT.market.clearSearch });

    this.allFilter = page.getByRole('button', { name: TEXT.market.filterAll });
    this.upFilter = page.getByRole('button', { name: TEXT.market.filterUp });
    this.downFilter = page.getByRole('button', { name: TEXT.market.filterDown });
    this.ownedFilter = page.getByRole('button', { name: TEXT.market.filterOwned });

    this.emptyMessage = page.getByTestId('market-empty');
    this.closedBanner = page.getByTestId('market-closed-banner');
    this.watchlistFullError = page.getByTestId('watchlist-full-error');

    this.loadingBox = page.getByTestId('market-loading');
    this.loadingBars = this.loadingBox.locator('span');
    this.errorBox = page.getByTestId('market-error');
    this.retryButton = page.getByRole('button', { name: TEXT.common.tryAgain });
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

  /**
   * Asks for the Market page without waiting for the table. A test that holds
   * the stock list back, or turns it into an error, needs the half-drawn page.
   */
  async gotoWithoutPrices(): Promise<void> {
    await this.openWithoutWaiting('market');
  }

  /**
   * Opens the Market page and comes straight back, without waiting for the
   * load event. A test that holds the stock list back needs the half-drawn
   * page, and waiting for load would wait for the held request as well.
   */
  async gotoWhileLoading(): Promise<void> {
    await this.page.goto(this.urlFor('market'), { waitUntil: 'commit' });
  }

  /** Presses "Try again" in the error box. */
  async retry(): Promise<void> {
    await this.retryButton.click();
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
