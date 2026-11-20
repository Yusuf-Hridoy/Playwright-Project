// Standing the clock still at one exact moment.
//
// Prices move with the clock, and so do the alert checker, the card step's
// processing timer, the news loader and every pop-up. Freezing time is what
// makes two runs on two machines agree.
//
// The test fixture does this to every test's page on its own. It is exported
// here because the odd test opens a second page of its own and wants that one
// standing just as still.

import type { Page } from '@playwright/test';

/** How far before the frozen moment the clock is installed. */
export const CLOCK_HEAD_START_MS = 5 * 60 * 1_000;

/**
 * Installs a clock on one page and parks it at the given moment. Time then
 * only moves when something calls page.clock.runFor().
 */
export async function freezeClock(page: Page, marketTime: string): Promise<void> {
  const moment = new Date(marketTime);

  // install() starts a clock that then ticks along in real time, so by the
  // time pauseAt() runs it is already a few milliseconds past. Asking it to
  // pause at a moment it has gone by is an error ("Cannot fast-forward to the
  // past"), and Firefox is slow enough between the two calls to hit it.
  // Starting five minutes early leaves room for any browser. Nothing is on
  // screen yet, so those five minutes are never seen by anyone.
  await page.clock.install({ time: new Date(moment.getTime() - CLOCK_HEAD_START_MS) });
  await page.clock.pauseAt(moment);
}
