// One stock's own page: the price, the chart, today's facts and the trade box.

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import type { PageObjectOptions } from './base-page';
import { ConfirmDialog } from '../components/confirm-dialog';
import { PriceChart } from '../components/price-chart';
import { TEXT } from '../data/expected-text';
import {
  CONFIRM_TRADE,
  SHARES_FIELD,
  TRADE_CONFIRM_HEADING,
  TRADE_DONE_HEADING,
  TRADE_MAIN_BUTTON,
  renamedTestId,
} from '../data/label-synonyms';
import { healing } from '../utils/healing-locator';
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
    // The heading and the price are what say the page is ready, so they need
    // backup ways as much as the trade box does.
    this.symbolHeading = healing({
      where: 'StockPage',
      element: 'symbol heading',
      ways: [
        { how: 'test id stock-symbol', locator: page.getByTestId('stock-symbol') },
        { how: 'the first level heading', locator: page.getByRole('heading', { level: 1 }) },
      ],
    });
    this.price = healing({
      where: 'StockPage',
      element: 'price',
      ways: [
        { how: 'test id stock-price', locator: page.getByTestId('stock-price') },
        { how: 'renamed test id stock-price', locator: page.getByTestId(renamedTestId('stock-price')) },
      ],
    });
    this.change = page.getByTestId('stock-change');

    this.buyTab = healing({
      where: 'StockPage',
      element: 'Buy tab',
      ways: [
        { how: 'role tab named Buy', locator: page.getByRole('tab', { name: TEXT.stock.tabBuy }) },
        { how: 'renamed test id tab-buy', locator: page.getByTestId(renamedTestId('tab-buy')) },
      ],
    });
    this.sellTab = healing({
      where: 'StockPage',
      element: 'Sell tab',
      ways: [
        { how: 'role tab named Sell', locator: page.getByRole('tab', { name: TEXT.stock.tabSell }) },
        { how: 'renamed test id tab-sell', locator: page.getByTestId(renamedTestId('tab-sell')) },
      ],
    });

    this.sharesField = healing({
      where: 'StockPage',
      element: 'shares field',
      ways: [
        { how: 'label How many shares?', locator: page.getByLabel(TEXT.stock.sharesLabel) },
        { how: 'label how many shares or quantity', locator: page.getByLabel(SHARES_FIELD) },
      ],
    });
    this.oneMoreButton = page.getByRole('button', { name: TEXT.stock.oneMore });
    this.oneLessButton = page.getByRole('button', { name: TEXT.stock.oneLess });
    this.maxButton = page.getByRole('button', { name: /^Max: \d+$/ });

    this.summaryPrice = page.getByTestId('summary-price');
    this.summaryShares = page.getByTestId('summary-shares');
    this.summaryTotal = healing({
      where: 'StockPage',
      element: 'summary total',
      ways: [
        { how: 'test id summary-total', locator: page.getByTestId('summary-total') },
        { how: 'renamed test id summary-total', locator: page.getByTestId(renamedTestId('summary-total')) },
      ],
    });
    this.summaryCashAfter = page.getByTestId('summary-cash-after');

    // The button names itself after what it will do, like "Buy 5 KRYL".
    this.submitButton = healing({
      where: 'StockPage',
      element: 'main trade button',
      ways: [
        {
          how: 'role button named Buy or Sell with a number',
          locator: page.getByRole('button', { name: /^(Buy|Sell) \d+ [A-Z]+$/ }),
        },
        { how: 'role button named buy, sell or place order', locator: page.getByRole('button', { name: TRADE_MAIN_BUTTON }) },
      ],
    });
    this.error = page.getByTestId('trade-error');
    this.closedBanner = page.getByTestId('trade-closed-banner');

    const confirmRoot = healing({
      where: 'StockPage',
      element: 'confirm box',
      ways: [
        { how: 'test id confirm-dialog', locator: page.getByTestId('confirm-dialog') },
        {
          how: 'the dialog asking to buy or sell a number of shares',
          locator: page
            .getByRole('dialog')
            .filter({ has: page.getByRole('heading', { name: TRADE_CONFIRM_HEADING }) }),
        },
      ],
    });
    this.confirmDialog = new ConfirmDialog(
      confirmRoot,
      {
        confirm: new RegExp(`^(${TEXT.stock.confirmBuy}|${TEXT.stock.confirmSell})$`),
        cancel: TEXT.common.cancel,
      },
      {
        confirmButton: healing({
          where: 'StockPage',
          element: 'confirm button',
          ways: [
            {
              how: 'role button named Confirm buy or Confirm sell',
              locator: confirmRoot.getByRole('button', {
                name: new RegExp(`^(${TEXT.stock.confirmBuy}|${TEXT.stock.confirmSell})$`),
              }),
            },
            {
              how: 'role button that confirms a buy or a sell, old wording or new',
              locator: confirmRoot.getByRole('button', { name: CONFIRM_TRADE }),
            },
          ],
        }),
      },
    );

    this.success = healing({
      where: 'StockPage',
      element: 'success box',
      ways: [
        { how: 'test id trade-success', locator: page.getByTestId('trade-success') },
        { how: 'renamed test id trade-success', locator: page.getByTestId(renamedTestId('trade-success')) },
      ],
    });
    this.successTitle = healing({
      where: 'StockPage',
      element: 'success title',
      ways: [
        { how: 'test id success-title', locator: page.getByTestId('success-title') },
        { how: 'the heading that says Bought or Sold', locator: page.getByRole('heading', { name: TRADE_DONE_HEADING }) },
      ],
    });
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

  /**
   * Opens a stock and comes straight back, for a slow app whose price only
   * arrives once the clock is moved on.
   */
  async gotoWhileLoading(symbol: string): Promise<void> {
    await this.page.goto(this.urlFor('stock', { symbol }), { waitUntil: 'commit' });
  }

  /**
   * The price, but only once there is a real figure in it. While the app is
   * still loading the same element reads "-", so this matches nothing, which
   * is what makes it something a test can wait for.
   */
  priceOnceLoaded(): Locator {
    return this.price.filter({ hasNotText: TEXT.common.placeholder });
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
