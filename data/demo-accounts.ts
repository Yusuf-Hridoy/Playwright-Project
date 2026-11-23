// The three demo accounts, copied from ../Practice-App/data/demo-users.json.
//
// The shapes below are the exact shapes the app keeps in localStorage
// (js/account-storage.js, js/watchlist-storage.js and js/profile-storage.js).
// The state builder writes these, so if the app rejects a shape it is because
// it is wrong here.

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
  /** Top-ups made by card carry the last four digits. */
  last4?: string;
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

export type Theme = 'dark' | 'light' | 'device';

export interface EmailChoices {
  alerts: boolean;
  summary: boolean;
  news: boolean;
}

/** The exact shape js/profile-storage.js reads and writes. */
export interface ProfileState {
  photoDataUrl: string | null;
  displayName: string;
  birthDate: string;
  country: string;
  sectors: string[];
  emails: EmailChoices;
  theme: Theme;
}

export interface DemoAccount {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
  /** The two letters the top menu shows when there is no photo. */
  readonly initials: string;
  /** The ID the Profile page shows and copies, like "TL-4821-TR". */
  readonly accountId: string;
  /** Where setup/save-logins.setup.ts keeps this account's signed-in session. */
  readonly storageState: string;
  readonly start: AccountState;
  readonly watchlistStart: WatchlistState;
  readonly profileStart: ProfileState;
}

export const DEMO_PASSWORD = 'Play123!';

/** Owns 20 LUMA and 5 KRYL, and has $8,808.40 left to spend. */
export const TRADER: DemoAccount = Object.freeze<DemoAccount>({
  email: 'trader@tradeloom.test',
  password: DEMO_PASSWORD,
  displayName: 'Trader',
  initials: 'TR',
  accountId: 'TL-4821-TR',
  storageState: '.auth/trader.json',
  start: {
    cashCents: 880840,
    totalAddedCents: 1000000,
    holdings: {
      LUMA: { shares: 20, totalPaidCents: 48800 },
      KRYL: { shares: 5, totalPaidCents: 70360 },
    },
    history: [
      {
        id: 'h1',
        time: '2026-11-02T15:02:00+06:00',
        type: 'start',
        amountCents: 1000000,
        cashAfterCents: 1000000,
      },
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
  profileStart: {
    photoDataUrl: null,
    displayName: 'Trader',
    birthDate: '1995-04-12',
    country: 'Bangladesh',
    sectors: ['Robotics', 'Health'],
    emails: { alerts: true, summary: false, news: false },
    theme: 'dark',
  },
});

/** $10,000 of cash, owns nothing, watches nothing and has a blank profile. */
export const NEWBIE: DemoAccount = Object.freeze<DemoAccount>({
  email: 'newbie@tradeloom.test',
  password: DEMO_PASSWORD,
  displayName: 'Newbie',
  initials: 'NB',
  accountId: 'TL-7730-NB',
  storageState: '.auth/newbie.json',
  start: {
    cashCents: 1000000,
    totalAddedCents: 1000000,
    holdings: {},
    history: [
      {
        id: 'h1',
        time: '2026-11-02T09:00:00+06:00',
        type: 'start',
        amountCents: 1000000,
        cashAfterCents: 1000000,
      },
    ],
  },
  watchlistStart: { symbols: [], alerts: {} },
  profileStart: {
    photoDataUrl: null,
    displayName: 'Newbie',
    birthDate: '',
    country: '',
    sectors: [],
    emails: { alerts: false, summary: false, news: false },
    theme: 'dark',
  },
});

/**
 * Seven holdings and 24 history rows. App Phase 4 added this account for the
 * history paging and filters, which are Phase 3 work; here it is the third
 * saved login and a busier account for the accessibility and visual passes.
 */
export const BUSY: DemoAccount = Object.freeze<DemoAccount>({
  email: 'busy@tradeloom.test',
  password: DEMO_PASSWORD,
  displayName: 'Busy',
  initials: 'BU',
  accountId: 'TL-5090-BU',
  storageState: '.auth/busy.json',
  start: {
    cashCents: 2808450,
    totalAddedCents: 4000000,
    holdings: {
      NOVA: { shares: 45, totalPaidCents: 235100 },
      PIXEL: { shares: 150, totalPaidCents: 146000 },
      KRYL: { shares: 5, totalPaidCents: 71250 },
      LUMA: { shares: 100, totalPaidCents: 256000 },
      TERRA: { shares: 70, totalPaidCents: 242760 },
      BRISK: { shares: 60, totalPaidCents: 108900 },
      VELO: { shares: 20, totalPaidCents: 155040 },
    },
    history: [
      {
        id: 'h1',
        time: '2026-10-20T09:05:00+06:00',
        type: 'start',
        amountCents: 1000000,
        cashAfterCents: 1000000,
      },
      {
        id: 'h2',
        time: '2026-10-20T10:15:00+06:00',
        type: 'buy',
        symbol: 'NOVA',
        shares: 30,
        priceCents: 5180,
        amountCents: -155400,
        cashAfterCents: 844600,
      },
      {
        id: 'h3',
        time: '2026-10-20T14:30:00+06:00',
        type: 'buy',
        symbol: 'PIXEL',
        shares: 200,
        priceCents: 990,
        amountCents: -198000,
        cashAfterCents: 646600,
      },
      {
        id: 'h4',
        time: '2026-10-21T11:05:00+06:00',
        type: 'buy',
        symbol: 'KRYL',
        shares: 4,
        priceCents: 14100,
        amountCents: -56400,
        cashAfterCents: 590200,
      },
      {
        id: 'h5',
        time: '2026-10-22T09:30:00+06:00',
        type: 'add',
        amountCents: 500000,
        cashAfterCents: 1090200,
        last4: '4242',
      },
      {
        id: 'h6',
        time: '2026-10-22T10:45:00+06:00',
        type: 'buy',
        symbol: 'LUMA',
        shares: 150,
        priceCents: 2560,
        amountCents: -384000,
        cashAfterCents: 706200,
      },
      {
        id: 'h7',
        time: '2026-10-23T13:20:00+06:00',
        type: 'sell',
        symbol: 'PIXEL',
        shares: 80,
        priceCents: 1045,
        amountCents: 83600,
        cashAfterCents: 789800,
      },
      {
        id: 'h8',
        time: '2026-10-26T09:50:00+06:00',
        type: 'buy',
        symbol: 'TERRA',
        shares: 60,
        priceCents: 3510,
        amountCents: -210600,
        cashAfterCents: 579200,
      },
      {
        id: 'h9',
        time: '2026-10-26T15:40:00+06:00',
        type: 'buy',
        symbol: 'BRISK',
        shares: 100,
        priceCents: 1815,
        amountCents: -181500,
        cashAfterCents: 397700,
      },
      {
        id: 'h10',
        time: '2026-10-27T10:10:00+06:00',
        type: 'add',
        amountCents: 1000000,
        cashAfterCents: 1397700,
        last4: '4242',
      },
      {
        id: 'h11',
        time: '2026-10-27T11:30:00+06:00',
        type: 'buy',
        symbol: 'VELO',
        shares: 12,
        priceCents: 7820,
        amountCents: -93840,
        cashAfterCents: 1303860,
      },
      {
        id: 'h12',
        time: '2026-10-28T14:05:00+06:00',
        type: 'sell',
        symbol: 'NOVA',
        shares: 10,
        priceCents: 5340,
        amountCents: 53400,
        cashAfterCents: 1357260,
      },
      {
        id: 'h13',
        time: '2026-10-29T10:25:00+06:00',
        type: 'buy',
        symbol: 'KRYL',
        shares: 3,
        priceCents: 14450,
        amountCents: -43350,
        cashAfterCents: 1313910,
      },
      {
        id: 'h14',
        time: '2026-10-30T11:50:00+06:00',
        type: 'sell',
        symbol: 'LUMA',
        shares: 50,
        priceCents: 2680,
        amountCents: 134000,
        cashAfterCents: 1447910,
      },
      {
        id: 'h15',
        time: '2026-11-02T09:40:00+06:00',
        type: 'buy',
        symbol: 'PIXEL',
        shares: 150,
        priceCents: 960,
        amountCents: -144000,
        cashAfterCents: 1303910,
      },
      {
        id: 'h16',
        time: '2026-11-02T15:15:00+06:00',
        type: 'add',
        amountCents: 500000,
        cashAfterCents: 1803910,
        last4: '4242',
      },
      {
        id: 'h17',
        time: '2026-11-03T10:05:00+06:00',
        type: 'buy',
        symbol: 'NOVA',
        shares: 25,
        priceCents: 5260,
        amountCents: -131500,
        cashAfterCents: 1672410,
      },
      {
        id: 'h18',
        time: '2026-11-03T16:20:00+06:00',
        type: 'sell',
        symbol: 'BRISK',
        shares: 40,
        priceCents: 1890,
        amountCents: 75600,
        cashAfterCents: 1748010,
      },
      {
        id: 'h19',
        time: '2026-11-04T09:55:00+06:00',
        type: 'buy',
        symbol: 'TERRA',
        shares: 40,
        priceCents: 3405,
        amountCents: -136200,
        cashAfterCents: 1611810,
      },
      {
        id: 'h20',
        time: '2026-11-04T14:40:00+06:00',
        type: 'sell',
        symbol: 'KRYL',
        shares: 2,
        priceCents: 14620,
        amountCents: 29240,
        cashAfterCents: 1641050,
      },
      {
        id: 'h21',
        time: '2026-11-05T10:30:00+06:00',
        type: 'add',
        amountCents: 1000000,
        cashAfterCents: 2641050,
        last4: '4242',
      },
      {
        id: 'h22',
        time: '2026-11-05T13:10:00+06:00',
        type: 'buy',
        symbol: 'VELO',
        shares: 8,
        priceCents: 7650,
        amountCents: -61200,
        cashAfterCents: 2579850,
      },
      {
        id: 'h23',
        time: '2026-11-06T11:15:00+06:00',
        type: 'sell',
        symbol: 'PIXEL',
        shares: 120,
        priceCents: 1010,
        amountCents: 121200,
        cashAfterCents: 2701050,
      },
      {
        id: 'h24',
        time: '2026-11-06T15:05:00+06:00',
        type: 'sell',
        symbol: 'TERRA',
        shares: 30,
        priceCents: 3580,
        amountCents: 107400,
        cashAfterCents: 2808450,
      },
    ],
  },
  watchlistStart: { symbols: ['PIXEL', 'TERRA', 'VELO'], alerts: {} },
  profileStart: {
    photoDataUrl: null,
    displayName: 'Busy',
    birthDate: '',
    country: '',
    sectors: [],
    emails: { alerts: false, summary: false, news: false },
    theme: 'dark',
  },
});

export const DEMO_ACCOUNTS: readonly DemoAccount[] = Object.freeze([TRADER, NEWBIE, BUSY]);

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

/** The three sector choices a test uses, from js/profile-storage.js. */
export const SECTORS: readonly string[] = Object.freeze([
  'Energy',
  'Robotics',
  'Food',
  'Health',
  'Finance',
  'Games',
  'Farming',
  'Transport',
]);

/** The most sectors anyone may pick, from js/profile-storage.js. */
export const MAX_SECTORS = 3;

/** The youngest a person may be, from js/profile-rules.js. */
export const MIN_AGE = 18;
