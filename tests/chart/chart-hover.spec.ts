// The hover point on a Stock page chart: the dashed line, the dot and the
// little box with a time and a price.
//
// It answers the mouse and the keyboard, and every keyboard move is also put
// into a hidden status line so a screen reader hears where the point went.

import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import { chartPointText } from '../../data/expected-text';
import { money } from '../../utils/money';

/** A clock time the chart can show, like "09:55". */
const CLOCK_TEXT = /^\d{2}:\d{2}$/;

/**
 * The frozen clock, as the chart writes it. Every test starts at 10:00:00
 * Dhaka, which is exactly on a five minute mark.
 */
const FROZEN_CLOCK = '10:00';
/** The point before it. The chart has one every five minutes. */
const FIVE_MINUTES_EARLIER = '09:55';
/** The first point of the day. The chart starts at midnight. */
const FIRST_POINT = '00:00';

test.describe('The price chart hover point', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'hovering the middle of the chart shows a time and a price, and leaving hides them',
    {
      tag: ['@regression', '@p3', '@REQ-LIVE-01'],
    },
    async ({ stockPage }) => {
      const chart = stockPage.priceChart;

      await stockPage.goto('KRYL');

      await expect(chart.tooltip).toBeHidden();

      await chart.hoverAt(0.5);

      await expect(chart.tooltip).toBeVisible();

      const timeText = await chart.tooltipTimeText();
      const priceCents = await chart.tooltipPriceCents();

      expect(timeText).toMatch(CLOCK_TEXT);
      expect(priceCents).toBeGreaterThan(0);
      await expect(chart.tooltipTime).toHaveText(timeText);
      await expect(chart.tooltipPrice).toHaveText(money(priceCents));

      await test.step('taking the mouse off the chart puts the box away', async () => {
        await chart.moveAway();

        await expect(chart.tooltip).toBeHidden();
      });
    },
  );

  test(
    'Home, End and the arrow keys walk the point, and the announcer says where it went',
    {
      tag: ['@regression', '@p3', '@REQ-LIVE-01'],
    },
    async ({ stockPage }) => {
      const chart = stockPage.priceChart;

      await stockPage.goto('KRYL');

      await test.step('End goes to the newest point', async () => {
        await chart.pressKey('End');

        await expect(chart.tooltip).toBeVisible();
        expect(await chart.tooltipTimeText()).toBe(FROZEN_CLOCK);
        await expect(chart.announcer).toHaveText(
          chartPointText(FROZEN_CLOCK, money(await chart.tooltipPriceCents())),
        );
      });

      await test.step('Home goes to the first point of the day', async () => {
        await chart.pressKey('Home');

        expect(await chart.tooltipTimeText()).toBe(FIRST_POINT);
        await expect(chart.announcer).toHaveText(
          chartPointText(FIRST_POINT, money(await chart.tooltipPriceCents())),
        );
      });

      await test.step('the right arrow steps forward five minutes', async () => {
        await chart.pressKey('ArrowRight');

        expect(await chart.tooltipTimeText()).toBe('00:05');
        await expect(chart.announcer).toHaveText(
          chartPointText('00:05', money(await chart.tooltipPriceCents())),
        );
      });

      await test.step('and the left arrow steps back again', async () => {
        await chart.pressKey('ArrowLeft');

        expect(await chart.tooltipTimeText()).toBe(FIRST_POINT);
        await expect(chart.announcer).toHaveText(
          chartPointText(FIRST_POINT, money(await chart.tooltipPriceCents())),
        );
      });
    },
  );

  test(
    'the last point is not shown twice at an exact five minute mark',
    {
      tag: ['@regression', '@p3', '@REQ-LIVE-01'],
    },
    async ({ stockPage }) => {
      // The clock is frozen at 10:00:00, which is the case that used to break.
      // The chart has a point every five minutes and adds a "now" point on top,
      // so at 10:00:00 the two are the same minute. When the app kept both, End
      // read 10:00 and the left arrow read 10:00 again instead of 09:55.
      const chart = stockPage.priceChart;

      await stockPage.goto('KRYL');

      await chart.pressKey('End');

      expect(await chart.tooltipTimeText()).toBe(FROZEN_CLOCK);

      await chart.pressKey('ArrowLeft');

      expect(
        await chart.tooltipTimeText(),
        'The left arrow walked from 10:00 back to 10:00, so the newest point is on the chart twice.',
      ).toBe(FIVE_MINUTES_EARLIER);
      await expect(chart.announcer).toHaveText(
        chartPointText(FIVE_MINUTES_EARLIER, money(await chart.tooltipPriceCents())),
      );
    },
  );
});
