// The app's own <dialog>. There are two: the trade confirm box on the stock
// page and the start over box in the wallet. Their buttons read differently,
// so the names come in from the page object that owns the dialog.

import type { Locator } from '@playwright/test';

export interface ConfirmDialogNames {
  /** The name on the button that goes ahead, like "Confirm buy". */
  readonly confirm: string | RegExp;
  /** The name on the button that backs out, usually "Cancel". */
  readonly cancel: string | RegExp;
}

/**
 * Locators the owning page object would rather supply itself, because it has
 * a backup way of finding them. Anything left out is found the usual way.
 */
export interface ConfirmDialogParts {
  readonly confirmButton?: Locator;
}

export class ConfirmDialog {
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  /** The question at the top, like "Buy 5 KRYL?". */
  readonly title: Locator;

  constructor(
    readonly root: Locator,
    names: ConfirmDialogNames,
    parts: ConfirmDialogParts = {},
  ) {
    this.confirmButton = parts.confirmButton ?? root.getByRole('button', { name: names.confirm });
    this.cancelButton = root.getByRole('button', { name: names.cancel });
    this.title = root.getByRole('heading');
  }

  /** The dialog's money rows. Each one carries its exact data-cents. */
  valuesWithCents(): Locator {
    return this.root.locator('[data-cents]');
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
