// The "Are you still there?" dialog, 14 minutes into doing nothing.
//
// The app opens it with showModal() and counts the last minute down with a one
// second setInterval, so a test moves the clock instead of waiting.

import type { Locator, Page } from '@playwright/test';
import { TEXT } from '../data/expected-text';

export class IdleDialog {
  readonly root: Locator;
  /** The countdown inside the sentence, like "0:59". */
  readonly countdown: Locator;
  readonly stayButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId('idle-dialog');
    this.countdown = this.root.getByTestId('idle-countdown');
    this.stayButton = this.root.getByRole('button', { name: TEXT.idle.stay });
    this.logoutButton = this.root.getByRole('button', { name: TEXT.idle.logoutNow });
  }

  /** Keeps the session, which also puts the idle timer back to zero. */
  async stayLoggedIn(): Promise<void> {
    await this.stayButton.click();
  }

  /** Ends the session now, without waiting for the last minute to run out. */
  async logOutNow(): Promise<void> {
    await this.logoutButton.click();
  }
}
