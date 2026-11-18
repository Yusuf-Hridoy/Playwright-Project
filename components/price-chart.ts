// The big price chart on a Stock page, and the point someone is reading.
//
// The chart answers both the mouse and the keyboard. The mouse moves the point
// with hoverAt(); the keyboard moves it with Home, End and the arrow keys, and
// every keyboard move is also said out loud through the announcer.

import type { Locator, Page } from '@playwright/test';
import { boxOf } from '../utils/layout';
import { centsOf } from '../utils/money';

export class PriceChart {
  /** The box the mouse moves over. It is also the thing the keys talk to. */
  readonly hoverArea: Locator;
  /** The small box with the time and the price. Hidden until a point is picked. */
  readonly tooltip: Locator;
  readonly tooltipTime: Locator;
  readonly tooltipPrice: Locator;
  /** The hidden status line a screen reader reads on each keyboard move. */
  readonly announcer: Locator;

  constructor(private readonly page: Page) {
    this.hoverArea = page.getByTestId('chart-hover-area');
    this.tooltip = page.getByTestId('chart-tooltip');
    this.tooltipTime = page.getByTestId('chart-tooltip-time');
    this.tooltipPrice = page.getByTestId('chart-tooltip-price');
    this.announcer = page.getByTestId('chart-announcer');
  }

  /**
   * Moves the mouse to that share of the chart's width, 0 being the left edge
   * and 1 the right. The chart then picks the point nearest the pointer.
   */
  async hoverAt(fraction: number): Promise<void> {
    const box = await boxOf(this.hoverArea, 'the chart hover area');
    await this.page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2);
  }

  /** Takes the mouse off the chart, which puts the tooltip away again. */
  async moveAway(): Promise<void> {
    const box = await boxOf(this.hoverArea, 'the chart hover area');
    await this.page.mouse.move(box.x + box.width / 2, Math.max(0, box.y - 20));
  }

  /** Presses one key on the chart, focusing it first. */
  async pressKey(key: string): Promise<void> {
    await this.hoverArea.press(key);
  }

  /** The time the tooltip is quoting, read from the app's own attribute. */
  async tooltipTimeText(): Promise<string> {
    return (await this.tooltip.getAttribute('data-time')) ?? '';
  }

  /** The price the tooltip is quoting, in whole cents. */
  async tooltipPriceCents(): Promise<number> {
    return centsOf(this.tooltip);
  }
}
