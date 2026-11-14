// Writes an exact account straight into browser storage, before the page loads.
//
// Clicking through five trades to reach a starting point is slow and it can
// fail for reasons that have nothing to do with the test. This writes the
// account the app would have ended up with, in the shape the app expects.
//
//   await accountState
//     .forUser(TRADER)
//     .withCash(50_000)                                    // cents
//     .withHolding('KRYL', { shares: 10, totalPaidCents: 140_000 })
//     .withWatchlist(['NOVA', 'KRYL'])
//     .withAlert('NOVA', { direction: 'above', priceCents: 5_500 })
//     .apply();
//
// The app checks the shape of everything it reads (js/account-storage.js and
// js/watchlist-storage.js) and quietly falls back to the demo data when it does
// not fit. That failure is silent, so every test that builds state calls
// expectApplied() once the page is open.

import { expect, type Page } from '@playwright/test';
import type {
  AccountState,
  AlertDirection,
  DemoAccount,
  EmailChoices,
  HistoryEntry,
  Holding,
  PriceAlert,
  ProfileState,
  Theme,
  WatchlistState,
} from '../data/demo-accounts';
import { MAX_SECTORS, MAX_WATCHLIST, SECTORS } from '../data/demo-accounts';
import { SYMBOLS } from '../data/stocks';

export const SESSION_KEY = 'tradeloom.session';
export const ACCOUNT_KEY_PREFIX = 'tradeloom.account.';
export const WATCHLIST_KEY_PREFIX = 'tradeloom.watchlist.';
export const PROFILE_KEY_PREFIX = 'tradeloom.profile.';

/** Marks the one page load that wrote the state, so later loads leave it alone. */
export const APPLIED_MARKER_KEY = 'tradeloom.test.state-applied';

export interface AlertOptions {
  readonly direction: AlertDirection;
  readonly priceCents: number;
  /** Show a pop-up in the app when it fires. On by default. */
  readonly popup?: boolean;
  /** Also ask the browser to notify. Off by default. */
  readonly browser?: boolean;
}

/** Everything withProfile() can set. Anything left out keeps its saved value. */
export interface ProfileOptions {
  readonly photoDataUrl?: string | null;
  readonly displayName?: string;
  /** "YYYY-MM-DD", or "" for no date at all. */
  readonly birthDate?: string;
  readonly country?: string;
  readonly sectors?: readonly string[];
  readonly emails?: Partial<EmailChoices>;
  readonly theme?: Theme;
}

interface Written {
  readonly sessionKey: string;
  readonly accountKey: string;
  readonly watchlistKey: string;
  readonly profileKey: string;
  readonly markerKey: string;
  readonly email: string;
  readonly account: AccountState;
  readonly watchlist: WatchlistState;
  /** null leaves whatever the app would write for this account. */
  readonly profile: ProfileState | null;
}

function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class AccountStateBuilder {
  private user: DemoAccount | null = null;
  private cashCents: number | null = null;
  private holdings: Record<string, Holding> | null = null;
  private watchlistSymbols: string[] | null = null;
  private alerts: Record<string, PriceAlert> = {};
  private profile: ProfileState | null = null;
  private applied = false;

  constructor(private readonly page: Page) {}

  /** Which demo account this state belongs to. Always the first call. */
  forUser(user: DemoAccount): this {
    this.user = user;
    this.cashCents = null;
    this.holdings = null;
    this.watchlistSymbols = null;
    this.alerts = {};
    this.profile = null;
    this.applied = false;
    return this;
  }

  /** Cash to spend, in whole cents. 50_000 is $500.00. */
  withCash(cents: number): this {
    this.assertWholeCents(cents, 'cash');
    this.cashCents = cents;
    return this;
  }

  /** Gives the account this many shares of one stock, for this much money. */
  withHolding(symbol: string, holding: Holding): this {
    this.assertKnownSymbol(symbol);
    if (!Number.isInteger(holding.shares) || holding.shares <= 0) {
      throw new Error(`A holding needs at least 1 whole share, but ${symbol} was given ${holding.shares}.`);
    }
    this.assertWholeCents(holding.totalPaidCents, `${symbol} totalPaidCents`);
    this.holdings = { ...(this.holdings ?? deepCopy(this.requireUser().start.holdings)) };
    this.holdings[symbol] = { ...holding };
    return this;
  }

  /** Starts from an account that owns nothing. */
  withNoHoldings(): this {
    this.holdings = {};
    return this;
  }

  /** Drops one stock from the holdings. */
  withoutHolding(symbol: string): this {
    this.holdings = { ...(this.holdings ?? deepCopy(this.requireUser().start.holdings)) };
    delete this.holdings[symbol];
    return this;
  }

  /** The watchlist, in the order the page should show it. */
  withWatchlist(symbols: readonly string[]): this {
    for (const symbol of symbols) this.assertKnownSymbol(symbol);
    if (new Set(symbols).size !== symbols.length) {
      throw new Error(`A watchlist cannot hold the same stock twice: ${symbols.join(', ')}.`);
    }
    if (symbols.length > MAX_WATCHLIST) {
      throw new Error(`A watchlist holds at most ${MAX_WATCHLIST} stocks, but ${symbols.length} were given.`);
    }
    this.watchlistSymbols = [...symbols];
    return this;
  }

  /** One price alert, on a stock that is on the watchlist. */
  withAlert(symbol: string, options: AlertOptions): this {
    this.assertKnownSymbol(symbol);
    this.assertWholeCents(options.priceCents, `${symbol} alert price`);
    this.alerts[symbol] = {
      direction: options.direction,
      priceCents: options.priceCents,
      popup: options.popup ?? true,
      browser: options.browser ?? false,
      status: 'waiting',
      hitAt: null,
      hitPriceCents: null,
    };
    return this;
  }

  /**
   * The saved profile, in the exact shape js/profile-storage.js keeps. Anything
   * left out keeps the value this account starts with, so a test can change one
   * field and say nothing about the rest:
   *
   *   .withProfile({ theme: 'light' })
   *   .withProfile({ displayName: 'Mira Khan', sectors: ['Energy'] })
   */
  withProfile(options: ProfileOptions): this {
    const start = deepCopy(this.requireUser().profileStart);
    const base = this.profile ?? start;

    const sectors = options.sectors === undefined ? base.sectors : [...options.sectors];
    for (const sector of sectors) {
      if (!SECTORS.includes(sector)) {
        throw new Error(`There is no sector called ${sector}. The app lists ${SECTORS.join(', ')}.`);
      }
    }
    if (sectors.length > MAX_SECTORS) {
      throw new Error(`A profile holds at most ${MAX_SECTORS} sectors, but ${sectors.length} were given.`);
    }
    if (new Set(sectors).size !== sectors.length) {
      throw new Error(`A profile cannot hold the same sector twice: ${sectors.join(', ')}.`);
    }

    this.profile = {
      photoDataUrl: options.photoDataUrl === undefined ? base.photoDataUrl : options.photoDataUrl,
      displayName: options.displayName ?? base.displayName,
      birthDate: options.birthDate ?? base.birthDate,
      country: options.country ?? base.country,
      sectors,
      emails: { ...base.emails, ...(options.emails ?? {}) },
      theme: options.theme ?? base.theme,
    };
    return this;
  }

  /** The profile this builder will write, for a test that asserts on it. */
  expectedProfile(): ProfileState {
    return deepCopy(this.profile ?? this.requireUser().profileStart);
  }

  /**
   * Writes the state. The script runs on every page load, so it writes only on
   * the first one: a buy made during the test must survive the next page.
   */
  async apply(): Promise<void> {
    const written = this.build();
    await this.page.addInitScript((state: Written) => {
      try {
        if (window.sessionStorage.getItem(state.markerKey) !== null) return;
        window.localStorage.setItem(state.sessionKey, JSON.stringify({ email: state.email }));
        window.localStorage.setItem(state.accountKey, JSON.stringify(state.account));
        window.localStorage.setItem(state.watchlistKey, JSON.stringify(state.watchlist));
        if (state.profile !== null) {
          window.localStorage.setItem(state.profileKey, JSON.stringify(state.profile));
        }
        window.sessionStorage.setItem(state.markerKey, '1');
      } catch {
        // Storage can be blocked. expectApplied() turns that into a clear failure.
      }
    }, written);
    this.applied = true;
  }

  /**
   * Checks the app accepted the state, by comparing the cash in the top menu
   * with the cash this builder asked for. A shape the app rejects shows up here
   * as a loud failure instead of a confusing one three steps later.
   */
  async expectApplied(): Promise<void> {
    if (!this.applied) {
      throw new Error('expectApplied() was called before apply(), so there is nothing to check.');
    }
    const wanted = this.cashCents ?? this.requireUser().start.cashCents;
    await expect(
      this.page.getByTestId('menu-cash'),
      'The app fell back to the demo data, so the state written by the builder did not fit its storage shape.',
    ).toHaveAttribute('data-cents', String(wanted));
  }

  /** The cash this builder asked for, for a test that wants to assert on it. */
  expectedCashCents(): number {
    return this.cashCents ?? this.requireUser().start.cashCents;
  }

  // --- building the stored shapes ---

  private build(): Written {
    const user = this.requireUser();
    const holdings = this.holdings ?? deepCopy(user.start.holdings);
    const cashCents = this.cashCents ?? user.start.cashCents;

    const paidCents = Object.values(holdings).reduce((sum, holding) => sum + holding.totalPaidCents, 0);
    // Money in = money still in cash + money already spent on stock. Keeping
    // these in step means the wallet's history adds up like a real one.
    const totalAddedCents = cashCents + paidCents;

    const account: AccountState = {
      cashCents,
      totalAddedCents,
      holdings,
      history: this.buildHistory(totalAddedCents, holdings),
    };

    const symbols = this.watchlistSymbols ?? deepCopy(user.watchlistStart.symbols);
    const alerts =
      this.watchlistSymbols === null && Object.keys(this.alerts).length === 0
        ? deepCopy(user.watchlistStart.alerts)
        : this.alerts;

    for (const symbol of Object.keys(alerts)) {
      if (!symbols.includes(symbol)) {
        throw new Error(
          `${symbol} has an alert but is not on the watchlist. The app would throw the whole watchlist away.`,
        );
      }
    }

    return {
      sessionKey: SESSION_KEY,
      accountKey: `${ACCOUNT_KEY_PREFIX}${user.email}`,
      watchlistKey: `${WATCHLIST_KEY_PREFIX}${user.email}`,
      profileKey: `${PROFILE_KEY_PREFIX}${user.email}`,
      markerKey: APPLIED_MARKER_KEY,
      email: user.email,
      account,
      watchlist: { symbols, alerts },
      profile: this.profile === null ? null : deepCopy(this.profile),
    };
  }

  /** A starting top-up, then one buy per holding, with the cash running down. */
  private buildHistory(totalAddedCents: number, holdings: Record<string, Holding>): HistoryEntry[] {
    const history: HistoryEntry[] = [
      {
        id: 'h1',
        time: '2026-11-02T09:00:00+06:00',
        type: 'start',
        amountCents: totalAddedCents,
        cashAfterCents: totalAddedCents,
      },
    ];

    let cashAfter = totalAddedCents;
    for (const [symbol, holding] of Object.entries(holdings)) {
      cashAfter -= holding.totalPaidCents;
      history.push({
        id: `h${history.length + 1}`,
        time: '2026-11-02T10:00:00+06:00',
        type: 'buy',
        symbol,
        shares: holding.shares,
        priceCents: Math.round(holding.totalPaidCents / holding.shares),
        amountCents: -holding.totalPaidCents,
        cashAfterCents: cashAfter,
      });
    }

    return history;
  }

  // --- small checks, so a mistake fails here and not inside the browser ---

  private requireUser(): DemoAccount {
    if (this.user === null) {
      throw new Error('Call forUser(...) before anything else on the state builder.');
    }
    return this.user;
  }

  private assertWholeCents(value: number, what: string): void {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${what} must be whole cents, 0 or more, but it is ${value}.`);
    }
  }

  private assertKnownSymbol(symbol: string): void {
    if (!SYMBOLS.includes(symbol)) {
      throw new Error(`There is no stock called ${symbol}. The 8 stocks are ${SYMBOLS.join(', ')}.`);
    }
  }
}
