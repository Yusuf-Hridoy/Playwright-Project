// Builds page paths that work on both copies of the app.
//
// The live site serves clean links (/market). A plain `python -m http.server`
// has no rewrite rules, so it needs the file name (/market.html). The app does
// the same switch in js/app-links.js, keyed on the host name.

import { BASE_URL } from '../config/environments';
import { SEED } from '../config/test-settings';

export type AppPage = 'login' | 'market' | 'stock' | 'portfolio' | 'watchlist' | 'wallet' | 'rules';

const PAGE_FILES: Readonly<Record<AppPage, string>> = Object.freeze({
  login: 'index',
  market: 'market',
  stock: 'stock',
  portfolio: 'portfolio',
  watchlist: 'watchlist',
  wallet: 'wallet',
  rules: 'rules',
});

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
 * unless a test asks for a different seed on purpose.
 */
export function urlFor(
  page: AppPage,
  query: Readonly<Record<string, string>> = {},
  baseUrl: string = BASE_URL,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== '') search.set(key, value);
  }
  if (!search.has('seed')) search.set('seed', SEED);
  return `${pathFor(page, baseUrl)}?${search.toString()}`;
}
