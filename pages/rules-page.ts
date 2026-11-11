// The Rules page: one card for every rule the app follows. Open to everyone.

import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base-page';

export class RulesPage extends BasePage {
  readonly cards: Locator;

  constructor(page: Page) {
    super(page);
    this.cards = page.getByTestId('rules-card');
  }

  protected override readyElement(): Locator {
    return this.cards.first();
  }

  async goto(): Promise<void> {
    await this.open('rules');
  }

  /** One card, found by the rule the app marks it with, like "market-hours". */
  card(rule: string): Locator {
    return this.cards.and(this.page.locator(`[data-rule="${rule}"]`));
  }
}
