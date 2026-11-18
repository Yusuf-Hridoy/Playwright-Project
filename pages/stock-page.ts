// One stock's own page: the price, the chart, today's facts and the trade box.

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import type { PageObjectOptions } from './base-page';
import { ConfirmDialog } from '../components/confirm-dialog';
import { PriceChart } from '../components/price-chart';
import { TEXT } from '../data/expected-text';
import { centsOf } from '../utils/money';

export type TradeMode = 'buy' | 'sell';

export class StockPage extends BasePage {
  readonly symbolHeading: Locator;
  readonly price: Locator;
  readonly change: Locator;

  readonly buyTab: Locator;
  readonly sellTab: Locator;

  readonly sharesField: Locator;
  readonly oneMoreButton: Locator;
  readonly oneLessButton: Locator;
  /** The "Max: 37" button. The number moves with the price, so the name is a pattern. */
  readonly maxButton: Locator;

  /** The four summary rows. Each one carries its exact data-cents. */
  readonly summaryPrice: Locator;
  readonly summaryShares: Locator;
  readonly summaryTotal: Locator;
  readonly summaryCashAfter: Locator;

  readonly submitButton: Locator;
  readonly error: Locator;
  readonly closedBanner: Locator;

  readonly confirmDialog: ConfirmDialog;

  readonly success: Locator;
  readonly successTitle: Locator;
  readonly successDetail: Locator;
  readonly tradeAgainButton: Locator;

  /** Today's facts. "You own" and "You paid on average". */
  readonly factOwned: Locator;
  readonly factAvgPaid: Locator;

  /** The big chart, its hover point and the line a screen reader hears. */
  readonly priceChart: PriceChart;

  readonly notFound: Locator;
  /** The "Couldn't load prices" box, shown when the stock list will not load. */
  readonly loadError: Locator;
  readonly retryButton: Locator;

  constructor(page: Page, options: PageObjectOptions = {}) {
    super(page, options);
    this.symbolHeading = page.getByTestId('stock-symbol');
    this.price = page.getByTestId('stock-price');
    this.change = page.getByTestId('stock-change');

    this.buyTab = page.getByRole('tab', { name: TEXT.stock.tabBuy });
    this.sellTab = page.getByRole('tab', { name: TEXT.stock.tabSell });

    this.sharesField = page.getByLabel(TEXT.stock.sharesLabel);
    this.oneMoreButton = page.getByRole('button', { name: TEXT.stock.oneMore });
    this.oneLessButton = page.getByRole('button', { name: TEXT.stock.oneLess });
    this.maxButton = page.getByRole('button', { name: /^Max: \d+$/ });

    this.summaryPrice = page.getByTestId('summary-price');
    this.summaryShares = page.getByTestId('summary-shares');
    this.summaryTotal = page.getByTestId('summary-total');
    this.summaryCashAfter = page.getByTestId('summary-cash-after');

    // The button names itself after what it will do, like "Buy 5 KRYL".
    this.submitButton = page.getByRole('button', { name: /^(Buy|Sell) \d+ [A-Z]+$/ });
    this.error = page.getByTestId('trade-error');
    this.closedBanner = page.getByTestId('trade-closed-banner');

    this.confirmDialog = new ConfirmDialog(page.getByTestId('confirm-dialog'), {
      confirm: new RegExp(`^(${TEXT.stock.confirmBuy}|${TEXT.stock.confirmSell})$`),
      cancel: TEXT.common.cancel,
    });

    this.success = page.getByTestId('trade-success');
    this.successTitle = page.getByTestId('success-title');
    this.successDetail = page.getByTestId('success-detail');
    this.tradeAgainButton = page.getByRole('button', { name: TEXT.stock.makeAnotherTrade });

    this.factOwned = page.getByTestId('fact-owned');
    this.factAvgPaid = page.getByTestId('fact-avg-paid');

    this.priceChart = new PriceChart(page);

    this.notFound = page.getByTestId('stock-not-found');
    this.loadError = page.getByTestId('market-error');
    this.retryButton = page.getByRole('button', { name: TEXT.common.tryAgain });
  }

  protected override readyElement(): Locator {
    return this.symbolHeading;
  }

  /** The page is drawn before the price is worked out, so wait for the figure. */
  override async waitUntilReady(): Promise<void> {
    await super.waitUntilReady();
    await expect(this.price).not.toHaveText(TEXT.common.placeholder);
  }

  /** Opens one stock, on the Buy tab unless a sell is asked for. */
  async goto(symbol: string, options: { mode?: TradeMode } = {}): Promise<void> {
    const query: Record<string, string> = { symbol };
    if (options.mode === 'sell') query['mode'] = 'sell';
    await this.open('stock', query);
  }

  /** Opens a stock without waiting for the price, for a load that will fail. */
  async gotoExpectingTrouble(symbol: string): Promise<void> {
    await this.openWithoutWaiting('stock', { symbol });
  }

  async priceCents(): Promise<number> {
    return centsOf(this.price);
  }

  /** The price the summary is quoting right now, in whole cents. */
  async summaryPriceCents(): Promise<number> {
    return centsOf(this.summaryPrice);
  }

  async summaryTotalCents(): Promise<number> {
    return centsOf(this.summaryTotal);
  }

  async summaryCashAfterCents(): Promise<number> {
    return centsOf(this.summaryCashAfter);
  }

  async enterShares(shares: number | string): Promise<void> {
    await this.sharesField.fill(String(shares));
  }

  async switchToSell(): Promise<void> {
    await this.sellTab.click();
  }

  /** Presses the Buy/Sell button. The confirm dialog opens unless a rule stops it. */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * The whole flow: type the shares, press the button, confirm the dialog.
   * Any rule that blocks the trade leaves the error text on the page instead.
   */
  async trade(shares: number | string): Promise<void> {
    await this.enterShares(shares);
    await this.submit();
    await this.confirmDialog.confirm();
  }

  /** The price the confirm dialog is showing, in whole cents. */
  async confirmedPriceCents(): Promise<number> {
    return centsOf(this.confirmDialog.valuesWithCents().first());
  }
}
