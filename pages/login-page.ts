// The log in page, which is also the site root.

import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base-page';
import type { PageObjectOptions } from './base-page';
import { TEXT } from '../data/expected-text';

export class LoginPage extends BasePage {
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly submitButton: Locator;
  readonly error: Locator;
  /** The line the app shows after an idle log out, above the form. */
  readonly infoMessage: Locator;
  /** The two demo account cards under the form. */
  readonly demoRows: Locator;

  constructor(page: Page, options: PageObjectOptions = {}) {
    super(page, options);
    this.emailField = page.getByLabel(TEXT.login.emailLabel);
    this.passwordField = page.getByLabel(TEXT.login.passwordLabel);
    this.submitButton = page.getByRole('button', { name: TEXT.login.submit });
    this.error = page.getByTestId('login-error');
    this.infoMessage = page.getByTestId('login-info');
    this.demoRows = page.getByTestId('demo-account-row');
  }

  protected override readyElement(): Locator {
    return this.submitButton;
  }

  async goto(): Promise<void> {
    await this.open('login');
  }

  /** Opens the log in page the way the app does when a page needs a session. */
  async gotoWithNext(nextPath: string): Promise<void> {
    await this.open('login', { next: nextPath });
  }

  async logIn(email: string, password: string): Promise<void> {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.submitButton.click();
  }

  /** Presses Log in without touching the fields. */
  async submitEmpty(): Promise<void> {
    await this.submitButton.click();
  }

  /** The card for one demo account, found by the email the app marks it with. */
  demoRow(email: string): Locator {
    return this.demoRows.and(this.page.locator(`[data-email="${email}"]`));
  }

  /** Presses "Use" on a demo account. It fills the form but does not log in. */
  async useDemoAccount(email: string): Promise<void> {
    await this.demoRow(email).getByRole('button', { name: TEXT.login.use }).click();
  }
}
