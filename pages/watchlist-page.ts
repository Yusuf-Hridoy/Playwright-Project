// The Watchlist page: up to 6 stocks in a chosen order, one price alert each,
// and the alert editor beside the list.

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { WatchlistRow } from '../components/watchlist-row';
import { TEXT } from '../data/expected-text';
import { centsOf } from '../utils/money';

export type AlertDirection = 'above' | 'below';

export class WatchlistPage extends BasePage {
  readonly heading: Locator;

  readonly addSelect: Locator;
  readonly addButton: Locator;
  readonly addError: Locator;
  /** The line that reports a move or a removal. */
  readonly statusLine: Locator;
  readonly emptyMessage: Locator;
  readonly removeAllButton: Locator;

  // The alert editor.
  readonly alertEditor: Locator;
  readonly alertEditorClosedHint: Locator;
  /** "Price now: $52.10". Its data-cents attribute holds the exact price. */
  readonly alertPriceNow: Locator;
  readonly alertAbove: Locator;
  readonly alertBelow: Locator;
  readonly alertPriceSlider: Locator;
  readonly alertPriceField: Locator;
  readonly alertPopupCheckbox: Locator;
  readonly alertBrowserCheckbox: Locator;
  readonly alertSaveButton: Locator;
  readonly alertDeleteButton: Locator;
  readonly alertCloseButton: Locator;
  readonly alertError: Locator;
  readonly alertMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: TEXT.watchlist.title, exact: true });

    this.addSelect = page.getByLabel(TEXT.watchlist.addLabel);
    this.addButton = page.getByRole('button', { name: TEXT.watchlist.add, exact: true });
    this.addError = page.getByTestId('watchlist-add-error');
    this.statusLine = page.getByTestId('watchlist-status');
    this.emptyMessage = page.getByTestId('watchlist-empty');
    this.removeAllButton = page.getByRole('button', { name: 'Remove all' });

    this.alertEditor = page.getByTestId('alert-editor');
    this.alertEditorClosedHint = page.getByTestId('alert-editor-closed');
    this.alertPriceNow = page.getByTestId('alert-price-now');
    this.alertAbove = page.getByRole('radio', { name: TEXT.alertEditor.above });
    this.alertBelow = page.getByRole('radio', { name: TEXT.alertEditor.below });
    this.alertPriceSlider = page.getByLabel(TEXT.alertEditor.priceLabel, { exact: true });
    this.alertPriceField = page.getByLabel(TEXT.alertEditor.priceInputLabel);
    this.alertPopupCheckbox = page.getByTestId('alert-popup-checkbox');
    this.alertBrowserCheckbox = page.getByTestId('alert-browser-checkbox');
    this.alertSaveButton = page.getByRole('button', { name: TEXT.alertEditor.save });
    this.alertDeleteButton = page.getByRole('button', { name: TEXT.alertEditor.delete });
    this.alertCloseButton = page.getByRole('button', { name: TEXT.alertEditor.close, exact: true });
    this.alertError = page.getByTestId('alert-error');
    this.alertMessage = page.getByTestId('alert-message');
  }

  protected override readyElement(): Locator {
    return this.heading;
  }

  /**
   * The heading is on the page before the stock list has been fetched, so the
   * rows are not there yet. Either a first row or the empty box means the list
   * has been drawn, and both carry their prices by then.
   */
  override async waitUntilReady(): Promise<void> {
    await super.waitUntilReady();
    // Once rows exist the empty box is still in the page, just hidden, so this
    // takes whichever comes first in the page: a row, or the empty box alone.
    await expect(this.allRows().first().or(this.emptyMessage).first()).toBeVisible();
  }

  async goto(): Promise<void> {
    await this.open('watchlist');
  }

  /** One row of the list, as a component. */
  row(symbol: string): WatchlistRow {
    return new WatchlistRow(this.page, symbol);
  }

  allRows(): Locator {
    return this.page.getByTestId('watchlist-row');
  }

  /** The symbols on the list, in the order they are shown. */
  async order(): Promise<string[]> {
    return this.allRows().evaluateAll((rows) => rows.map((row) => row.getAttribute('data-symbol') ?? ''));
  }

  /** Picks a stock in the drop-down and presses Add. */
  async addStock(symbol: string): Promise<void> {
    await this.addSelect.selectOption(symbol);
    await this.addButton.click();
  }

  /** Presses Remove all and says yes to the browser's own confirm box. */
  async removeAll(): Promise<void> {
    this.page.once('dialog', (dialog) => {
      void dialog.accept();
    });
    await this.removeAllButton.click();
  }

  /** The price the editor is quoting right now, in whole cents. */
  async alertPriceNowCents(): Promise<number> {
    return centsOf(this.alertPriceNow);
  }

  /**
   * Fills in the open alert editor and saves it. The price is in dollars,
   * written the way a person would type it, like "52.11".
   */
  async saveAlert(options: { direction: AlertDirection; priceDollars: string; popup?: boolean }): Promise<void> {
    if (options.direction === 'above') await this.alertAbove.check();
    else await this.alertBelow.check();

    await this.alertPriceField.fill(options.priceDollars);

    if (options.popup === false) await this.alertPopupCheckbox.uncheck();
    else await this.alertPopupCheckbox.check();

    await this.alertSaveButton.click();
  }
}
