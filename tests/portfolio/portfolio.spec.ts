import { test, expect } from '../../fixtures/test-fixtures';
import { NEWBIE, TRADER } from '../../data/demo-accounts';
import { TEXT, portfolioEmptyBody } from '../../data/expected-text';
import { money } from '../../utils/money';

test.describe('A portfolio with stocks in it', () => {
  test.use({ storageState: TRADER.storageState });

  test('total worth is the cash plus every holding at today price', {
    tag: ['@smoke', '@regression'],
  }, async ({ portfolioPage }) => {
    await portfolioPage.goto();

    const cashCents = await portfolioPage.cashCents();
    let stocksWorthCents = 0;

    for (const [symbol, holding] of Object.entries(TRADER.start.holdings)) {
      const priceCents = await portfolioPage.priceCents(symbol);
      const worthCents = await portfolioPage.worthCents(symbol);

      expect(worthCents, `${symbol} is worth its shares times today's price`).toBe(holding.shares * priceCents);
      stocksWorthCents += worthCents;
    }

    const totalCents = cashCents + stocksWorthCents;
    expect(await portfolioPage.totalWorthCents()).toBe(totalCents);
    await expect(portfolioPage.totalWorth).toHaveText(money(totalCents));
    await expect(portfolioPage.stocksWorth).toHaveText(money(stocksWorthCents));
  });
});

test.describe('A portfolio with nothing in it', () => {
  test.use({ storageState: NEWBIE.storageState });

  test('a newbie is told there is nothing to show yet', { tag: ['@regression'] }, async ({ portfolioPage }) => {
    await portfolioPage.goto();

    await expect(portfolioPage.emptyMessage).toBeVisible();
    await expect(portfolioPage.emptyMessage).toContainText(TEXT.portfolio.emptyTitle);
    await expect(portfolioPage.emptyMessage).toContainText(
      portfolioEmptyBody(money(NEWBIE.start.cashCents)),
    );
    await expect(portfolioPage.allRows()).toHaveCount(0);
  });
});
