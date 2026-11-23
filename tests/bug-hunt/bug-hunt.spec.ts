// The bug hunt: proof that the everyday suite would notice if the app broke.
//
// A test that still passes on a broken app gives false confidence. So each of
// the app's five bugs is switched on here, and the very check the everyday
// suite makes is run against it. The checks are shared: every one of them is
// imported from checks/, and the normal test named above each test below
// calls the same function on a healthy app.
//
// Every test is marked test.fail(), so Playwright reads it the other way round:
//   green  — the check failed, which means the bug was caught.
//   red    — "expected to fail, but passed": the bug slipped through, and the
//            everyday test that shares this check is not really checking it.
//
// These never run in the everyday projects. They have their own project,
// `npm run test:bug-hunt`, which also prints the score.

import { test } from '../../fixtures/test-fixtures';
import { BUSY, NEWBIE, TRADER } from '../../data/demo-accounts';
import { expectBuyTotalIsRight } from '../../checks/trading-checks';
import {
  expectEachGainIsRight,
  expectSortByGainPutsTheBiggestFirst,
} from '../../checks/portfolio-checks';
import { expectTopUpsStopAtTheLimit } from '../../checks/wallet-checks';
import { expectSearchFindsOnly } from '../../checks/market-checks';

/** The bug needs two or more shares to show itself (js/pages/stock-page.js). */
const SHARES = 2;

test.describe('bug=cost: the total charges for one share too many', () => {
  test.use({ storageState: TRADER.storageState, bugs: ['cost'] });

  test(
    'buying 2 KRYL is caught by the buy total check',
    {
      tag: ['@bug-hunt', '@p1', '@REQ-SWITCH-01', '@REQ-TRADE-01'],
      annotation: { type: 'bug', description: 'cost' },
    },
    async ({ stockPage }) => {
      // Mirrors: tests/trading/buy.spec.ts, "buying 5 KRYL takes the same cash
      // in the summary, the message and the menu".
      test.fail();

      await stockPage.goto('KRYL');

      await expectBuyTotalIsRight(stockPage, SHARES);
    },
  );
});

test.describe('bug=gain: every gain is shown with the sign turned round', () => {
  test.use({ storageState: TRADER.storageState, bugs: ['gain'] });

  test(
    "the trader's holdings are caught by the gain check",
    {
      tag: ['@bug-hunt', '@p1', '@REQ-SWITCH-01', '@REQ-PORTFOLIO-02'],
      annotation: { type: 'bug', description: 'gain' },
    },
    async ({ portfolioPage }) => {
      // Mirrors: tests/portfolio/portfolio.spec.ts, "total worth is the cash
      // plus every holding at today price".
      test.fail();

      await portfolioPage.goto();

      await expectEachGainIsRight(portfolioPage, TRADER.start.holdings);
    },
  );
});

test.describe('bug=limit: top-ups run on past $50,000', () => {
  test.use({ storageState: NEWBIE.storageState, bugs: ['limit'] });

  test(
    'the extra top-up is caught by the add limit check',
    {
      tag: ['@bug-hunt', '@p1', '@REQ-SWITCH-01', '@REQ-WALLET-02'],
      annotation: { type: 'bug', description: 'limit' },
    },
    async ({ walletPage }) => {
      // Mirrors: tests/wallet/wallet.spec.ts, "top-ups stop once the account has
      // added $50,000 in all".
      test.fail();

      await walletPage.goto();

      await expectTopUpsStopAtTheLimit(walletPage, NEWBIE);
    },
  );
});

test.describe('bug=sort: Sort by gain puts the smallest gain first', () => {
  test.use({ storageState: BUSY.storageState, bugs: ['sort'] });

  test(
    'the upside-down order is caught by the sort check',
    {
      tag: ['@bug-hunt', '@p2', '@REQ-SWITCH-01', '@REQ-PORTFOLIO-02'],
      annotation: { type: 'bug', description: 'sort' },
    },
    async ({ portfolioPage }) => {
      // Mirrors: tests/portfolio/portfolio.spec.ts, '"Sort by gain" puts the
      // biggest gain at the top'.
      test.fail();

      await portfolioPage.goto();

      await expectSortByGainPutsTheBiggestFirst(portfolioPage);
    },
  );
});

test.describe('bug=search: the search box insists on the exact letter case', () => {
  test.use({ storageState: TRADER.storageState, bugs: ['search'] });

  test(
    'searching "kryl" in lower case is caught by the search check',
    {
      tag: ['@bug-hunt', '@p2', '@REQ-SWITCH-01', '@REQ-MARKET-02'],
      annotation: { type: 'bug', description: 'search' },
    },
    async ({ marketPage }) => {
      // Mirrors: tests/market/market.spec.ts, 'searching for "robot" leaves only
      // Kryl Robotics'.
      test.fail();

      await marketPage.goto();

      await expectSearchFindsOnly(marketPage, 'kryl', ['KRYL']);
    },
  );
});
