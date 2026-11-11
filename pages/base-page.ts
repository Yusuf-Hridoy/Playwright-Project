// What every page object shares: the page, the top menu, and one way to open
// a page that always carries the seed.

import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { TopMenu } from '../components/top-menu';
import { urlFor, type AppPage } from '../utils/app-paths';

export abstract class BasePage {
  readonly topMenu: TopMenu;

  constructor(readonly page: Page) {
    this.topMenu = new TopMenu(page);
  }

  /**
   * The element that means "this page has finished drawing itself". Every page
   * object names its own, so open() can hand back a page that is ready to use.
   */
  protected abstract readyElement(): Locator;

  /**
   * Goes to one of the app's pages. app-paths.ts picks /market or /market.html
   * to suit the host, and always adds ?seed=42 so prices repeat.
   */
  protected async open(target: AppPage, query: Readonly<Record<string, string>> = {}): Promise<void> {
    await this.page.goto(urlFor(target, query));
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
    await this.page.goto(urlFor(target, query));
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
