// Every message a test checks, copied word for word from ../Practice-App/js/ui-text.js.
//
// Nothing here is paraphrased. Messages that carry a number are small functions
// with the same shape as the app's, so a test never has to glue text together.

export const TEXT = Object.freeze({
  brand: 'Tradeloom',

  menu: Object.freeze({
    market: 'Market',
    portfolio: 'Portfolio',
    watchlist: 'Watchlist',
    wallet: 'Wallet',
    rules: 'Rules',
    profile: 'Your profile',
    marketOpen: 'Market open',
    marketClosed: 'Market closed',
    cash: 'Cash',
    logout: 'Log out',
    navLabel: 'Main menu',
  }),

  login: Object.freeze({
    cardTitle: 'Log in',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    submit: 'Log in',
    use: 'Use',
    missingFields: 'Enter your email and password.',
    wrongPair: 'Wrong email or password. Try again.',
  }),

  market: Object.freeze({
    title: 'Market',
    searchLabel: 'Search stocks',
    filterAll: 'All stocks',
    filterUp: 'Going up',
    filterDown: 'Going down',
    filterOwned: 'I own',
    noneOwned: '-',
    clearSearch: 'Clear search',
    emptyOwned: "You don't own any stocks yet.",
    emptyHint: 'Try a different name or symbol, like KRYL.',
    errorTitle: "Couldn't load prices",
    errorBody: 'The server had a problem. Your money is safe. Try again.',
  }),

  stock: Object.freeze({
    sharesLabel: 'How many shares?',
    oneLess: 'One less share',
    oneMore: 'One more share',
    tabBuy: 'Buy',
    tabSell: 'Sell',
    summaryTotalBuy: 'Total cost',
    summaryTotalSell: 'You get',
    confirmBuy: 'Confirm buy',
    confirmSell: 'Confirm sell',
    makeAnotherTrade: 'Make another trade',
  }),

  common: Object.freeze({
    /** What a figure reads before the prices arrive. */
    placeholder: '-',
    cancel: 'Cancel',
    backToMarket: 'Back to market',
    goToMarket: 'Go to market',
    seePortfolio: 'See portfolio',
    tryAgain: 'Try again',
  }),

  portfolio: Object.freeze({
    title: 'My portfolio',
    sortLabel: 'Sort holdings',
    emptyTitle: "You don't own any stocks yet",
  }),

  wallet: Object.freeze({
    title: 'Wallet',
    startOverButton: 'Start over',
    startOverConfirm: 'Yes, start over',
    startOverDone: 'Your account is back to how it started.',
    download: 'Download CSV',
    historyStart: 'Starting money',
    historyAdd: 'Added practice money',
  }),

  /** The card step on the Wallet page, and the form inside its frame. */
  payment: Object.freeze({
    stepTitle: 'Pay by card',
    /** The iframe's title, which is how a test reaches into the frame. */
    frameTitle: 'Card payment',
    nameLabel: 'Name on card',
    numberLabel: 'Card number',
    expiryLabel: 'Expiry (MM/YY)',
    cvcLabel: 'CVC',
    processing: 'Processing…',
    declined: 'Your card was declined. Try another card.',
    noFunds: "Your card doesn't have enough funds.",
    unknownCard: "We don't know this test card. Use one from the list.",
  }),

  watchlist: Object.freeze({
    title: 'Watchlist',
    addLabel: 'Add a stock',
    add: 'Add',
    full: 'Your watchlist is full. Remove a stock to add another.',
    emptyTitle: 'Your watchlist is empty',
    emptyBody: 'Add a stock above, or tap the ☆ on the Market page.',
    noAlert: 'No alert',
    removeAll: 'Remove all',
    removeAllConfirm: 'Remove all stocks from your watchlist?',
    browserAlertsButton: 'Turn on browser alerts',
    starOn: '★',
    starOff: '☆',
  }),

  /** The line beside the "Turn on browser alerts" button. */
  browserAlerts: Object.freeze({
    granted: 'Browser alerts are on.',
    denied: "Your browser blocked alerts. You'll still see pop-ups in the app.",
    off: 'Browser alerts are off.',
    unsupported: "This browser can't show alerts.",
  }),

  alertEditor: Object.freeze({
    closedHint: 'Press Alert on a stock to set a price alert.',
    above: 'Above',
    below: 'Below',
    priceLabel: 'Alert price',
    priceInputLabel: 'Alert price in dollars',
    popupLabel: 'Show a pop-up message in the app',
    browserLabel: 'Also send a browser notification',
    browserHint: 'Turn on browser alerts first.',
    save: 'Save alert',
    delete: 'Delete alert',
    close: 'Close',
    deleted: 'Alert deleted.',
    noChannel: 'Pick at least one way to be told.',
  }),

  profile: Object.freeze({
    title: 'Profile',

    photoTitle: 'Photo',
    photoLabel: 'Profile photo',
    removePhoto: 'Remove photo',
    photoSaved: 'Photo saved.',
    photoRemoved: 'Photo removed.',
    oneAtATime: 'Drop one photo at a time.',
    wrongType: 'Pick a PNG, JPG or WebP image.',
    tooBig: 'This photo is too big. Pick one under 1 MB.',

    accountIdLabel: 'Account ID',
    copyAccountId: 'Copy account ID',
    copied: 'Copied!',
    copyDone: 'Account ID copied.',
    copyFailed: "Couldn't copy. Select the ID and copy it yourself.",

    themeLegend: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeDevice: 'Match my device',

    displayNameLabel: 'Display name',
    displayNameError: 'Use 2 to 30 letters, numbers or spaces.',
    birthDateLabel: 'Date of birth',
    birthDateNotReal: 'Enter a real date of birth.',
    birthDateFuture: "Date of birth can't be in the future.",
    birthDateYoung: 'You must be 18 or older.',
    countryLabel: 'Country',
    sectorsLabel: 'Favorite sectors',
    sectorsTooMany: 'Pick up to 3 sectors.',
    selectAll: 'Select all',
    emailAlerts: 'Price alerts',
    emailSummary: 'Weekly summary',
    emailNews: 'News and tips',

    save: 'Save changes',
    saved: 'Your changes are saved.',
    unsaved: 'You have unsaved changes.',
    undo: 'Undo changes',
  }),

  rules: Object.freeze({
    title: 'How Tradeloom works',
  }),
});

// --- messages that carry a number ---

export function sharesWord(count: number): string {
  return count === 1 ? '1 share' : `${count} shares`;
}

/**
 * The market is open all day, every day. Only ?market=closed shuts it, so the
 * message now tells you how to open it again.
 */
export function marketClosed(): string {
  return "Market is closed. You can look at prices, but you can't buy or sell right now. Remove market=closed from the link to open it.";
}

export function wholeSharesOnly(): string {
  return 'Enter a whole number of shares, 1 or more.';
}

export function notEnoughCash(
  shares: number,
  symbol: string,
  costText: string,
  cashText: string,
  maxShares: number,
): string {
  return `Not enough cash. ${shares} ${symbol} costs ${costText} and you have ${cashText}. You can buy up to ${maxShares} shares.`;
}

export function cannotAffordOne(symbol: string): string {
  return `You don't have enough cash to buy 1 share of ${symbol}.`;
}

export function ownNone(symbol: string): string {
  return `You don't own any ${symbol}.`;
}

export function ownFewer(owned: number, symbol: string): string {
  return `You only own ${owned} ${symbol}. Enter ${owned} or less.`;
}

export function addLimitLeft(leftText: string): string {
  return `You can add up to ${leftText} more.`;
}

export function addLimitReached(): string {
  return 'You have reached the $50,000 limit.';
}

export function addedSoFar(totalAddedText: string): string {
  return `Added so far ${totalAddedText} of $50,000`;
}

/** What the Wallet says after a card goes through. */
export function addedWithCard(amountLabel: string, last4: string, cashNowText: string): string {
  return `Added ${amountLabel} with card ending ${last4}. Cash now: ${cashNowText}.`;
}

/** The What column of a top-up row in the history. */
export function historyAddWithCard(last4: string): string {
  return `Added practice money · card ending ${last4}`;
}

/** The line above the card frame, like "Paying $5,000". */
export function payingLine(amountLabel: string): string {
  return `Paying ${amountLabel}`;
}

/** The button inside the card frame, like "Pay $5,000". */
export function payButton(amountLabel: string): string {
  return `Pay ${amountLabel}`;
}

export function noMatch(searchText: string): string {
  return `No stocks match "${searchText}".`;
}

export function maxButton(count: number): string {
  return `Max: ${count}`;
}

export function buyButton(shares: number, symbol: string): string {
  return `Buy ${shares} ${symbol}`;
}

export function sellButton(shares: number, symbol: string): string {
  return `Sell ${shares} ${symbol}`;
}

export function confirmBuyTitle(shares: number, symbol: string): string {
  return `Buy ${shares} ${symbol}?`;
}

export function confirmSellTitle(shares: number, symbol: string): string {
  return `Sell ${shares} ${symbol}?`;
}

export function boughtTitle(shares: number, symbol: string): string {
  return `You bought ${shares} ${symbol}`;
}

export function soldTitle(shares: number, symbol: string): string {
  return `You sold ${shares} ${symbol}`;
}

export function boughtDetail(paidText: string, cashLeftText: string): string {
  return `Paid ${paidText}. Cash left: ${cashLeftText}.`;
}

export function soldDetail(gotText: string, cashNowText: string): string {
  return `Got ${gotText}. Cash now: ${cashNowText}.`;
}

export function portfolioEmptyBody(cashText: string): string {
  return `You have ${cashText} to start. Pick a stock and buy your first share.`;
}

export function watchlistOption(symbol: string, name: string): string {
  return `${symbol} · ${name}`;
}

export function movedMessage(symbol: string, position: number, total: number): string {
  return `${symbol} moved to position ${position} of ${total}.`;
}

export function removedFromWatchlist(symbol: string): string {
  return `${symbol} removed from your watchlist.`;
}

/** The star's own name on the Market page, when the stock is not watched yet. */
export function addStarLabel(symbol: string): string {
  return `Add ${symbol} to watchlist`;
}

export function removeStarLabel(symbol: string): string {
  return `Remove ${symbol} from watchlist`;
}

/** The pill on a waiting alert, like "Above $55.00". */
export function alertPill(directionLabel: string, priceText: string): string {
  return `${directionLabel} ${priceText}`;
}

export function alertHitAt(clockText: string): string {
  return `Hit at ${clockText}`;
}

export function alertSaved(symbol: string, directionWord: string, priceText: string): string {
  return `Alert saved. We'll tell you when ${symbol} goes ${directionWord} ${priceText}.`;
}

export function alertAboveError(priceText: string): string {
  return `For an Above alert, pick a price higher than ${priceText}.`;
}

export function alertBelowError(priceText: string): string {
  return `For a Below alert, pick a price lower than ${priceText}.`;
}

export function alertRangeError(lowText: string, highText: string): string {
  return `Enter a price between ${lowText} and ${highText}.`;
}

/** The pop-up a fired alert shows, like "NOVA went above $55.00". */
export function toastTitle(symbol: string, directionWord: string, priceText: string): string {
  return `${symbol} went ${directionWord} ${priceText}`;
}

export function toastDetail(priceText: string): string {
  return `Now ${priceText}.`;
}

export function historyBought(shares: number, symbol: string, priceText: string): string {
  return `Bought ${shares} ${symbol} at ${priceText}`;
}

export function historySold(shares: number, symbol: string, priceText: string): string {
  return `Sold ${shares} ${symbol} at ${priceText}`;
}

/** The name the Wallet page gives its CSV, like "tradeloom-history-2026-11-09.csv". */
export function historyFileName(dhakaDate: string): string {
  return `tradeloom-history-${dhakaDate}.csv`;
}

/** The summary above a form with problems in it. */
export function problemsMessage(count: number): string {
  return count === 1 ? 'Fix the 1 problem below.' : `Fix the ${count} problems below.`;
}
