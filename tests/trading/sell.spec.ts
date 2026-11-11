import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import { ownFewer, soldDetail, soldTitle } from '../../data/expected-text';
import { money } from '../../utils/money';

test.describe('Selling', () => {
  test.use({ storageState: TRADER.storageState });

  test('selling more shares than you own is refused', { tag: ['@regression'] }, async ({ stockPage }) => {
    const owned = TRADER.start.holdings['LUMA']!.shares;

    await stockPage.goto('LUMA', { mode: 'sell' });

    await stockPage.enterShares(owned + 1);
    await stockPage.submit();

    await expect(stockPage.error).toHaveText(ownFewer(owned, 'LUMA'));
    await expect(stockPage.confirmDialog.root).toBeHidden();
  });

  test('selling every LUMA share takes the stock off the portfolio', { tag: ['@regression'] }, async ({
    accountState,
    stockPage,
    portfolioPage,
    topMenu,
  }) => {
    const shares = 4;
    await accountState
      .forUser(TRADER)
      .withHolding('LUMA', { shares, totalPaidCents: 10_000 })
      .apply();

    await stockPage.goto('LUMA', { mode: 'sell' });
    await accountState.expectApplied();

    const cashBefore = await topMenu.cashCents();
    await stockPage.enterShares(shares);
    const priceCents = await stockPage.summaryPriceCents();
    const proceedsCents = shares * priceCents;

    await stockPage.submit();
    await stockPage.confirmDialog.confirm();

    await expect(stockPage.successTitle).toHaveText(soldTitle(shares, 'LUMA'));
    await expect(stockPage.successDetail).toHaveText(
      soldDetail(money(proceedsCents), money(cashBefore + proceedsCents)),
    );

    await test.step('the portfolio no longer lists LUMA', async () => {
      await topMenu.goToPortfolio();
      await portfolioPage.waitUntilReady();

      await expect(portfolioPage.row('LUMA')).toHaveCount(0);
      await expect(portfolioPage.row('KRYL')).toBeVisible();
    });
  });
});
