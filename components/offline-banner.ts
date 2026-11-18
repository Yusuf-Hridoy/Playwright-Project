// The bar the app puts at the top of every signed-in page while the internet
// is down. The top menu starts it, so it is on every page a test can reach.

import type { Locator, Page } from '@playwright/test';

export class OfflineBanner {
  readonly root: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId('offline-banner');
  }
}
