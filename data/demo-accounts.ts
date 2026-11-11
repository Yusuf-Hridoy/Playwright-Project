// The two demo accounts, copied from ../Practice-App/data/demo-users.json.
//
// The shapes below are the exact shapes the app keeps in localStorage
// (js/account-storage.js and js/watchlist-storage.js). The state builder
// writes these, so if the app rejects a shape it is because it is wrong here.

export type HistoryType = 'start' | 'add' | 'buy' | 'sell';

export interface Holding {
  shares: number;
  totalPaidCents: number;
}

export interface HistoryEntry {
  id: string;
  time: string;
  type: HistoryType;
  symbol?: string;
  shares?: number;
  priceCents?: number;
  amountCents: number;
  cashAfterCents: number;
}

export interface AccountState {
  cashCents: number;
  totalAddedCents: number;
  holdings: Record<string, Holding>;
  history: HistoryEntry[];
}

export type AlertDirection = 'above' | 'below';
export type AlertStatus = 'waiting' | 'hit';

export interface PriceAlert {
  direction: AlertDirection;
  priceCents: number;
  popup: boolean;
  browser: boolean;
  status: AlertStatus;
  hitAt: string | null;
  hitPriceCents: number | null;
}

export interface WatchlistState {
  symbols: string[];
  alerts: Record<string, PriceAlert>;
}

export interface DemoAccount {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
  /** Where setup/save-logins.setup.ts keeps this account's signed-in session. */
  readonly storageState: string;
  readonly start: AccountState;
  readonly watchlistStart: WatchlistState;
}

export const DEMO_PASSWORD = 'Play123!';

/** Owns 20 LUMA and 5 KRYL, and has $8,808.40 left to spend. */
export const TRADER: DemoAccount = Object.freeze<DemoAccount>({
  email: 'trader@tradeloom.test',
  password: DEMO_PASSWORD,
  displayName: 'Trader',
  storageState: '.auth/trader.json',
  start: {
    cashCents: 880840,
    totalAddedCents: 1000000,
    holdings: {
      LUMA: { shares: 20, totalPaidCents: 48800 },
      KRYL: { shares: 5, totalPaidCents: 70360 },
    },
    history: [
      { id: 'h1', time: '2026-11-02T15:02:00+06:00', type: 'start', amountCents: 1000000, cashAfterCents: 1000000 },
      {
        id: 'h2',
        time: '2026-11-02T15:10:00+06:00',
        type: 'buy',
        symbol: 'LUMA',
        shares: 20,
        priceCents: 2440,
        amountCents: -48800,
        cashAfterCents: 951200,
      },
      {
        id: 'h3',
        time: '2026-11-03T11:42:00+06:00',
        type: 'buy',
        symbol: 'KRYL',
        shares: 5,
        priceCents: 14072,
        amountCents: -70360,
        cashAfterCents: 880840,
      },
    ],
  },
  watchlistStart: {
    symbols: ['NOVA', 'PIXEL', 'BRISK', 'OAKFIN'],
    alerts: {
      NOVA: {
        direction: 'above',
        priceCents: 5500,
        popup: true,
        browser: false,
        status: 'waiting',
        hitAt: null,
        hitPriceCents: null,
      },
    },
  },
});

/** $10,000 of cash, owns nothing and watches nothing. */
export const NEWBIE: DemoAccount = Object.freeze<DemoAccount>({
  email: 'newbie@tradeloom.test',
  password: DEMO_PASSWORD,
  displayName: 'Newbie',
  storageState: '.auth/newbie.json',
  start: {
    cashCents: 1000000,
    totalAddedCents: 1000000,
    holdings: {},
    history: [
      { id: 'h1', time: '2026-11-02T09:00:00+06:00', type: 'start', amountCents: 1000000, cashAfterCents: 1000000 },
    ],
  },
  watchlistStart: { symbols: [], alerts: {} },
});

export const DEMO_ACCOUNTS: readonly DemoAccount[] = Object.freeze([TRADER, NEWBIE]);

/** The most you can ever add, from js/trade-rules.js. */
export const ADD_LIMIT_CENTS = 5000000;

/** The three top-up buttons on the Wallet page, in cents. */
export const ADD_CHOICES_CENTS = Object.freeze({
  '1000': 100000,
  '5000': 500000,
  '10000': 1000000,
});

/** The most stocks a watchlist can hold, from js/watchlist-storage.js. */
export const MAX_WATCHLIST = 6;
