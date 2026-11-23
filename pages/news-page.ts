// The News page: made-up headlines, ten at a time, with a filter per stock and
// a "Read more" on each one.
//
// The list only ever grows. Items already on the page are never rebuilt, which
// is the thing the endless scroll tests check.

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import type { PageObjectOptions } from './base-page';
import { TEXT } from '../data/expected-text';

export interface NewsQuery {
  /** The filter to open with, like "KRYL". Left out means All. */
  readonly stock?: string;
  /** One headline's id, which the app opens, scrolls to and focuses. */
  readonly focus?: string;
  /** A different seed, which gives the headlines a different order. */
  readonly seed?: string;
}

export class NewsPage extends BasePage {
  readonly heading: Locator;
  /** The row of filter chips, one per stock plus All and Market. */
  readonly filters: Locator;
  /** The line above the list, like "Showing 10 of 60". */
  readonly countLine: Locator;
  /** Every headline on the page right now. */
  readonly items: Locator;
  /** The "Loading more news…" line, shown for the one second before the next ten. */
  readonly loadingLine: Locator;
  /** The "You've reached the end." line, shown once all 60 are on the page. */
  readonly endLine: Locator;
  readonly backToTopButton: Locator;

  constructor(page: Page, options: PageObjectOptions = {}) {
    super(page, options);
    this.heading = page.getByRole('heading', { name: TEXT.news.title, level: 1 });
    this.filters = page.getByTestId('news-filter');
    this.countLine = page.getByTestId('news-count');
    this.items = page.getByTestId('news-item');
    this.loadingLine = page.getByTestId('news-loading');
    this.endLine = page.getByTestId('news-end');
    this.backToTopButton = page.getByRole('button', { name: TEXT.news.backToTop });
  }

  protected override readyElement(): Locator {
    return this.heading;
  }

  /** The heading is drawn before the headlines arrive, so wait for the first one. */
  override async waitUntilReady(): Promise<void> {
    await super.waitUntilReady();
    await expect(this.items.first()).toBeVisible();
  }

  async goto(query: NewsQuery = {}): Promise<void> {
    const search: Record<string, string> = {};
    if (query.stock !== undefined) search['stock'] = query.stock;
    if (query.focus !== undefined) search['focus'] = query.focus;
    if (query.seed !== undefined) search['seed'] = query.seed;
    await this.open('news', search);
  }

  /** One filter chip, found by the symbol the app marks it with. */
  filter(stock: string): Locator {
    return this.filters.and(this.page.locator(`[data-stock="${stock}"]`));
  }

  /** Presses one filter, which also writes ?stock= into the address bar. */
  async filterBy(stock: string): Promise<void> {
    await this.filter(stock).click();
  }

  /** One headline, found by its news id. */
  item(id: string): Locator {
    return this.items.and(this.page.locator(`[data-id="${id}"]`));
  }

  headline(id: string): Locator {
    return this.item(id).getByTestId('news-headline');
  }

  /** The "Read more" / "Show less" button on one headline. */
  readMoreButton(id: string): Locator {
    return this.item(id).getByTestId('news-read-more');
  }

  /** The summary under one headline. It is there but hidden until opened. */
  summary(id: string): Locator {
    return this.item(id).getByTestId('news-summary');
  }

  /** Opens or closes one summary, whichever the button is offering. */
  async toggleSummary(id: string): Promise<void> {
    await this.readMoreButton(id).click();
  }

  /** Every headline's text, in the order the page shows them. */
  async headlines(): Promise<string[]> {
    return this.items.getByTestId('news-headline').allInnerTexts();
  }

  /** The news ids on the page, newest first. */
  async itemIds(): Promise<string[]> {
    return this.items.evaluateAll((rows) => rows.map((row) => row.getAttribute('data-id') ?? ''));
  }

  /** The symbols the headlines on the page belong to. */
  async itemStocks(): Promise<string[]> {
    return this.items.evaluateAll((rows) =>
      rows.map((row) => row.getAttribute('data-stock') ?? ''),
    );
  }

  /**
   * Scrolls the last headline on the page into view, which is what asks the
   * app for the next ten. The marker the app watches sits just under the list,
   * so the page goes all the way down rather than stopping at the last item.
   */
  async scrollToEnd(): Promise<void> {
    await this.items.last().evaluate((element) => {
      element.scrollIntoView({ block: 'end' });
      window.scrollTo({ top: document.documentElement.scrollHeight });
    });
  }

  /** Goes back to the very top, the long way, so "Back to top" appears. */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo({ top: 0 }));
  }

  /** How far down the page is right now, in pixels. */
  async scrollY(): Promise<number> {
    return this.page.evaluate(() => window.scrollY);
  }

  async backToTop(): Promise<void> {
    await this.backToTopButton.click();
  }
}
