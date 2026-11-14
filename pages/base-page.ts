// What every page object shares: the page, the top menu, and one way to open
// a page that always carries the seed.

import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { TopMenu } from '../components/top-menu';
import { urlFor, type AppPage } from '../utils/app-paths';

export interface PageObjectOptions {
  /**
   * When true every page this object opens carries ?market=closed, which is
   * the only thing that shuts the market now. The app copies the switch onto
   * every link it draws, so it survives moving around inside the app.
   */
  readonly marketClosed?: boolean;
}

export abstract class BasePage {
  readonly topMenu: TopMenu;
  protected readonly marketClosed: boolean;

  constructor(readonly page: Page, options: PageObjectOptions = {}) {
    this.topMenu = new TopMenu(page);
    this.marketClosed = options.marketClosed === true;
  }

  /**
   * The element that means "this page has finished drawing itself". Every page
   * object names its own, so open() can hand back a page that is ready to use.
   */
  protected abstract readyElement(): Locator;

  /** The link this page object would open, switches and all. */
  urlFor(target: AppPage, query: Readonly<Record<string, string>> = {}): string {
    return urlFor(target, query, { marketClosed: this.marketClosed });
  }

  /**
   * Goes to one of the app's pages. app-paths.ts picks /market or /market.html
   * to suit the host, and always adds ?seed=42 so prices repeat.
   */
  protected async open(target: AppPage, query: Readonly<Record<string, string>> = {}): Promise<void> {
    await this.page.goto(this.urlFor(target, query));
    await this.waitUntilReady();
  }

  /**
   * Goes to a page without waiting for it to draw. A page that needs a session
   * sends a logged out visitor to the log in page instead, and that is the
   * thing some tests are there to check.
   */
  protected async openWithoutWaiting(
    target: AppPage,
    query: Readonly<Record<string, string>> = {},
  ): Promise<void> {
    await this.page.goto(this.urlFor(target, query));
  }

  /** Waits for this page's own ready element. No fixed waits anywhere. */
  async waitUntilReady(): Promise<void> {
    await expect(this.readyElement()).toBeVisible();
  }

  /** The path this page lives at, for a test that checks where it ended up. */
  path(target: AppPage): string {
    return urlFor(target).split('?')[0] ?? '/';
  }
}
