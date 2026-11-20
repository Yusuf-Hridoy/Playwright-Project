// The list a team keeps when the product changes its wording.
//
// Real apps rename things. A button that said "Log in" last month says "Sign
// in" today, and every test that looked for it by name stops working at once.
// Rather than chase each one, the backup locators in utils/healing-locator.ts
// look for either name, and the heal report then says which locators are
// living on the old wording and want updating.
//
// Everything below is copied from DRIFT_TEXT in ../Practice-App/js/ui-text.js
// and from the app's own labels in the same file. Nothing is guessed. When
// the product renames something again, the new word is added here and the
// suite keeps running while the locators are caught up with.

/** Log in / Sign in. */
export const LOG_IN = /^(log in|sign in)$/i;

/** Log out / Sign out. */
export const LOG_OUT = /^(log out|sign out)$/i;

/** Market / Stocks, in the top menu. */
export const MARKET_LINK = /^(market|stocks)$/i;

/** Search stocks / Find a stock. */
export const SEARCH_STOCKS = /^(search stocks|find a stock)$/i;

/** How many shares? / Quantity. */
export const SHARES_FIELD = /^(how many shares\?|quantity)$/i;

/** Confirm buy / Yes, buy — and the same for a sell. */
export const CONFIRM_TRADE = /^(confirm buy|yes, buy|confirm sell|yes, sell)$/i;

/** "Buy 5 KRYL" / "Place buy order", and the sell side of both. */
export const TRADE_MAIN_BUTTON = /^((buy|sell) \d+ [A-Z]+|place (buy|sell) order)$/i;

/** "Add $5,000" / "Top up $5,000". */
export const ADD_MONEY_BUTTON = /^(add|top up) \$[\d,]+$/i;

/** The heading over a finished trade: "You bought 5 KRYL" or "You sold 1 LUMA". */
export const TRADE_DONE_HEADING = /^you (bought|sold) \d+ [A-Z]+$/i;

/** The question a trade's confirm box asks: "Buy 5 KRYL?". */
export const TRADE_CONFIRM_HEADING = /^(buy|sell) \d+ [A-Z]+\?$/i;

/**
 * The other half of the same problem: a newer version of the app renames
 * every test id by one rule instead of one at a time
 * (../Practice-App/js/test-ids.js), so `login-submit` becomes
 * `tl-login_submit`.
 *
 * A locator for a figure in a table has no role and no label to fall back on,
 * so for those few the backup way is the same id under the newer rule. It is
 * still a backup that has to be noticed and fixed, and it still lands in the
 * heal report, which is the point.
 */
export function renamedTestId(id: string): string {
  return `tl-${id.replace(/-/g, '_')}`;
}
