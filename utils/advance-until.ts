// Moving a frozen clock forward a step at a time, until something shows up.
//
// With the slow switch on, the app does not do all its waiting at once. The
// account loads, then the stock list, then the news: each timer is only
// started when the one before it has finished. One big page.clock.runFor()
// would run past the first timer and then sit there, because the second timer
// had not been created yet when the clock moved.
//
// So this moves the clock in small steps and looks at the page after each one,
// which is what a person watching a slow page would do.

import { expect, type Locator, type Page } from '@playwright/test';

/** How far the clock moves between looks. */
export const DEFAULT_STEP_MS = 500;

/** The most make-believe time to spend before giving up. */
export const DEFAULT_MAX_MS = 30_000;

/**
 * How long each look lasts in real time.
 *
 * The slow switch is a timer in front of a real request. Moving the clock
 * starts the request; the answer then has to travel the real internet, which
 * no clock can hurry along. So each look is a short ordinary wait on the
 * locator, which is both the look and the room the answer needs to arrive in.
 */
export const DEFAULT_SETTLE_MS = 200;

export interface AdvanceOptions {
  /** How far to move the clock between looks. */
  readonly stepMs?: number;
  /** The most make-believe time to spend in all. */
  readonly maxMs?: number;
  /** How long each look waits in real time, for the answer to arrive. */
  readonly settleMs?: number;
  /** What is being waited for, for the message if it never turns up. */
  readonly what?: string;
}

/**
 * Moves the page's clock forward until the locator is on screen.
 *
 * Throws with a clear message once maxMs of the page's own time has gone by,
 * because "it never showed up after a minute of app time" is a different
 * problem from "the test timed out".
 */
export async function advanceUntil(
  page: Page,
  locator: Locator,
  options: AdvanceOptions = {},
): Promise<void> {
  const stepMs = options.stepMs ?? DEFAULT_STEP_MS;
  const maxMs = options.maxMs ?? DEFAULT_MAX_MS;
  const settleMs = options.settleMs ?? DEFAULT_SETTLE_MS;
  const what = options.what ?? 'what the test was waiting for';

  if (stepMs <= 0) throw new Error('advanceUntil needs a step bigger than zero.');

  let movedMs = 0;
  while (movedMs <= maxMs) {
    if (await showedUp(locator, settleMs)) {
      // One last web-first assertion, so the wait ends the way every other
      // wait in this suite ends.
      await expect(locator).toBeVisible();
      return;
    }
    await page.clock.runFor(stepMs);
    movedMs += stepMs;
  }

  if (await showedUp(locator, settleMs)) return;

  throw new Error(
    `The clock moved ${maxMs} ms of the app's own time and ${what} never showed up. ` +
      'Either the app is waiting on something else, or the step is too big to catch it.',
  );
}

/** One short, ordinary wait. True when it turned up, false when it did not. */
async function showedUp(locator: Locator, settleMs: number): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout: settleMs });
    return true;
  } catch {
    return false;
  }
}
