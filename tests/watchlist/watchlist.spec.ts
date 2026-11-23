import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import { TEXT, alertPill, movedMessage } from '../../data/expected-text';
import { money } from '../../utils/money';

test.describe('The watchlist', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'starts in the saved order, with the NOVA alert waiting at $55.00',
    {
      tag: ['@smoke', '@regression', '@p2', '@REQ-WATCH-02', '@REQ-WATCH-03'],
    },
    async ({ watchlistPage }) => {
      const saved = TRADER.watchlistStart;

      await watchlistPage.goto();

      expect(await watchlistPage.order()).toEqual(saved.symbols);

      const novaAlert = saved.alerts['NOVA'];
      await expect(watchlistPage.row('NOVA').alertStatus).toHaveText(
        alertPill(TEXT.alertEditor.above, money(novaAlert.priceCents)),
      );

      for (const symbol of saved.symbols.filter((one) => !(one in saved.alerts))) {
        await expect(watchlistPage.row(symbol).alertStatus).toHaveText(TEXT.watchlist.noAlert);
      }
    },
  );

  test(
    'dragging a row changes the order, and the new order survives a reload',
    {
      tag: ['@regression', '@p2', '@REQ-WATCH-02'],
    },
    async ({ watchlistPage, page }) => {
      const [first, second, third, fourth] = TRADER.watchlistStart.symbols as [
        string,
        string,
        string,
        string,
      ];

      await watchlistPage.goto();
      expect(await watchlistPage.order()).toEqual([first, second, third, fourth]);

      // The first row is dropped onto the third, so it lands in third place.
      await watchlistPage.row(first).dragOnto(watchlistPage.row(third));

      const moved = [second, third, first, fourth];
      await expect(watchlistPage.statusLine).toHaveText(movedMessage(first, 3, moved.length));
      expect(await watchlistPage.order()).toEqual(moved);

      await test.step('the order is still there after a reload', async () => {
        await page.reload();
        await watchlistPage.waitUntilReady();

        expect(await watchlistPage.order()).toEqual(moved);
      });
    },
  );
});
