// Builds page paths that work on both copies of the app.
//
// The live site serves clean links (/market). A plain `python -m http.server`
// has no rewrite rules, so it needs the file name (/market.html). The app does
// the same switch in js/app-links.js, keyed on the host name.

import { BASE_URL } from '../config/environments';
import { MARKET_CLOSED_VALUE, MARKET_PARAM, SEED } from '../config/test-settings';

/** The five bugs the app can be asked to show, from js/test-switches.js. */
export type BugName = 'cost' | 'gain' | 'limit' | 'sort' | 'search';

/** The four ways the app can pretend to be a newer version, from js/drift.js. */
export type DriftName = 'text' | 'ids' | 'layout' | 'popup';

/**
 * The app's test switches, as a test asks for them. Every one is off unless a
 * test turns it on, so a plain run builds exactly the links it built before.
 */
export interface AppSwitches {
  readonly bugs?: readonly BugName[];
  readonly drift?: readonly DriftName[];
  /** How long every data load waits, in real milliseconds. 0 is off. */
  readonly slowMs?: number;
  readonly flaky?: boolean;
  /** Overrides the usual ?seed=42. */
  readonly seed?: string;
}

/** Nothing switched on. The value every page object starts from. */
export const NO_SWITCHES: AppSwitches = Object.freeze({});

/**
 * The query the app reads its switches from (js/test-switches.js). This is the
 * one place that knows the names, so a page object never builds a link itself.
 */
export function switchQuery(switches: AppSwitches = NO_SWITCHES): Record<string, string> {
  const query: Record<string, string> = {};
  if (switches.bugs !== undefined && switches.bugs.length > 0) query['bug'] = switches.bugs.join(',');
  if (switches.drift !== undefined && switches.drift.length > 0) query['drift'] = switches.drift.join(',');
  if (switches.slowMs !== undefined && switches.slowMs > 0) query['slow'] = String(switches.slowMs);
  if (switches.flaky === true) query['flaky'] = 'on';
  if (switches.seed !== undefined && switches.seed !== '') query['seed'] = switches.seed;
  return query;
}

export type AppPage =
  | 'login'
  | 'market'
  | 'stock'
  | 'portfolio'
  | 'watchlist'
  | 'news'
  | 'wallet'
  | 'profile'
  | 'rules'
  | 'receipt';

const PAGE_FILES: Readonly<Record<AppPage, string>> = Object.freeze({
  login: 'index',
  market: 'market',
  stock: 'stock',
  portfolio: 'portfolio',
  watchlist: 'watchlist',
  news: 'news',
  wallet: 'wallet',
  profile: 'profile',
  rules: 'rules',
  receipt: 'receipt',
});

export interface UrlOptions {
  /** Adds ?market=closed, the only switch that shuts the market now. */
  readonly marketClosed?: boolean;
  /** The app's test switches: bugs, drift, slow, flaky and the seed. */
  readonly switches?: AppSwitches;
  readonly baseUrl?: string;
}

export function isLocalHost(baseUrl: string = BASE_URL): boolean {
  const host = new URL(baseUrl).hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/** The path part only, with no query: "/market" or "/market.html". */
export function pathFor(page: AppPage, baseUrl: string = BASE_URL): string {
  // The log in page is always the site root, on both copies.
  if (page === 'login') return '/';
  const file = PAGE_FILES[page];
  return isLocalHost(baseUrl) ? `/${file}.html` : `/${file}`;
}

/**
 * The full path a test opens. Every page gets ?seed=42 so prices repeat,
 * unless a test asks for a different seed on purpose. A test that wants the
 * market shut asks for it here, and the app then carries ?market=closed onto
 * every link it draws.
 */
export function urlFor(
  page: AppPage,
  query: Readonly<Record<string, string>> = {},
  options: UrlOptions = {},
): string {
  const baseUrl = options.baseUrl ?? BASE_URL;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== '') search.set(key, value);
  }
  // The switches go on before the usual seed, so a test that asked for its own
  // seed keeps it. Anything the caller put in `query` still wins over both.
  for (const [key, value] of Object.entries(switchQuery(options.switches))) {
    if (!search.has(key)) search.set(key, value);
  }
  if (!search.has('seed')) search.set('seed', SEED);
  if (options.marketClosed === true && !search.has(MARKET_PARAM)) {
    search.set(MARKET_PARAM, MARKET_CLOSED_VALUE);
  }
  return `${pathFor(page, baseUrl)}?${search.toString()}`;
}
