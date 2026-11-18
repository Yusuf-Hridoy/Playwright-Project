// The <tradeloom-news> box on the Market page.
//
// Everything the box shows lives inside an open shadow root. Playwright's
// getByTestId and getByRole reach through an open shadow boundary on their
// own, so nothing here has to be written differently because of it.

import type { Locator, Page } from '@playwright/test';
import { TEXT } from '../data/expected-text';

/** The custom element the app defines in js/components/news-box.js. */
export const NEWS_BOX_TAG = 'tradeloom-news';

export class NewsBox {
  /** The custom element itself. Its shadow root holds everything below. */
  readonly root: Locator;
  /** The three headlines. */
  readonly items: Locator;
  /** The Hide / Show button. Its name changes with the state. */
  readonly toggleButton: Locator;
  /** The "See all news" link at the bottom of the box. */
  readonly seeAllLink: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator(NEWS_BOX_TAG);
    this.items = this.root.getByTestId('news-box-item');
    this.toggleButton = this.root.getByTestId('news-box-toggle');
    this.seeAllLink = this.root.getByTestId('news-box-all');
  }

  /** One headline, found by the news id the app marks its row with. */
  item(id: string): Locator {
    return this.items.and(this.page.locator(`[data-id="${id}"]`));
  }

  /** The link inside one row, which is the headline itself. */
  link(id: string): Locator {
    return this.item(id).getByTestId('news-box-link');
  }

  /** Every headline, in the order the box shows them. */
  async headlines(): Promise<string[]> {
    return this.items.getByTestId('news-box-link').allInnerTexts();
  }

  /** The news ids of the rows on show, newest first. */
  async itemIds(): Promise<string[]> {
    return this.items.evaluateAll((rows) => rows.map((row) => row.getAttribute('data-id') ?? ''));
  }

  /** Presses Hide or Show, whichever the button is offering. */
  async toggle(): Promise<void> {
    await this.toggleButton.click();
  }

  /** Opens the News page through the "See all news" link. */
  async openAllNews(): Promise<void> {
    await this.seeAllLink.click();
  }

  /** Opens one headline on the News page. */
  async openItem(id: string): Promise<void> {
    await this.link(id).click();
  }

  /**
   * Whether the box really is drawn inside an open shadow root. A closed root,
   * or no root at all, both read as false here.
   */
  async hasOpenShadowRoot(): Promise<boolean> {
    return this.root.evaluate((element) => element.shadowRoot !== null);
  }

  /** The name the button is showing right now: "Hide" while the box is open. */
  hideButton(): Locator {
    return this.root.getByRole('button', { name: TEXT.news.hide });
  }

  showButton(): Locator {
    return this.root.getByRole('button', { name: TEXT.news.show });
  }
}
