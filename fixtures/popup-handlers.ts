// The two surprise popups the app shows with drift=popup, and the handlers
// that close them.
//
// These are only registered for tests that asked for drift=popup. In every
// other project a popup that turns up on its own is a real change in the app,
// and the test it interrupts should fail and say so.
//
// Both popups are found by role and by the words a person reads, never by a
// test id, so they are still found when drift=ids is on at the same time.

import { test, type Locator, type Page } from '@playwright/test';
import { TEXT } from '../data/expected-text';

/** The annotation one closed popup leaves behind. The heal reporter counts these. */
export const POPUP_ANNOTATION = 'popup-closed';

/** How long after a logged-in page loads the cookie banner turns up (js/drift.js). */
export const COOKIE_DELAY_MS = 2_000;

export type PopupName = 'cookie banner' | 'Pro dialog';

/** Notes one closed popup against the test that was interrupted. */
function recordPopup(name: PopupName): void {
  test.info().annotations.push({ type: POPUP_ANNOTATION, description: name });
}

/**
 * The cookie banner. The app gives it role="dialog" and uses the sentence
 * itself as the dialog's name, so role and words are enough to find it.
 */
export function cookieBanner(page: Page): Locator {
  return page.getByRole('dialog', { name: TEXT.popups.cookieBody });
}

/**
 * The "Try Tradeloom Pro" dialog. It is a real <dialog> opened with
 * showModal(), and it has no accessible name of its own, so it is picked out
 * by the heading inside it rather than by a name.
 */
export function proDialog(page: Page): Locator {
  return page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: TEXT.popups.proTitle }) });
}

/**
 * Teaches the page to close both popups whenever one gets in the way.
 * Playwright checks the handlers before every action, so a test never has to
 * know that a popup happened: it only shows up in the heal report afterwards.
 */
export async function registerPopupHandlers(page: Page): Promise<void> {
  const banner = cookieBanner(page);
  await page.addLocatorHandler(banner, async () => {
    await banner.getByRole('button', { name: TEXT.popups.cookieReject }).click();
    recordPopup('cookie banner');
  });

  const promo = proDialog(page);
  await page.addLocatorHandler(promo, async () => {
    await promo.getByRole('button', { name: TEXT.popups.proNoThanks }).click();
    recordPopup('Pro dialog');
  });
}
