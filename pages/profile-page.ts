// The Profile page: the photo, the account ID, the theme and the details form.

import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base-page';
import type { PageObjectOptions } from './base-page';
import { TEXT } from '../data/expected-text';
import type { Theme } from '../data/demo-accounts';

/** One file a test hands to the drop zone, with its bytes. */
export interface DroppedFile {
  readonly name: string;
  readonly mimeType: string;
  readonly bytes: Buffer;
}

/** Everything fillDetails() can set. Anything left out is left alone. */
export interface DetailsInput {
  readonly displayName?: string;
  /** "YYYY-MM-DD". */
  readonly birthDate?: string;
  readonly country?: string;
  readonly sectors?: readonly string[];
}

export type EmailChoice = 'alerts' | 'summary' | 'news';

export class ProfilePage extends BasePage {
  readonly heading: Locator;
  readonly form: Locator;

  // The photo.
  readonly photoInput: Locator;
  readonly photoDropZone: Locator;
  readonly photoPreview: Locator;
  readonly removePhotoButton: Locator;
  /** One line for both the good news and the problems. */
  readonly photoMessage: Locator;

  // The account ID.
  readonly accountId: Locator;
  readonly copyButton: Locator;
  readonly copyStatus: Locator;

  // The theme.
  readonly darkTheme: Locator;
  readonly lightTheme: Locator;
  readonly deviceTheme: Locator;

  // The details form.
  readonly displayNameField: Locator;
  readonly displayNameError: Locator;
  readonly birthDateField: Locator;
  readonly birthDateError: Locator;
  readonly countryField: Locator;
  readonly sectorsField: Locator;
  readonly sectorsError: Locator;

  readonly selectAllEmails: Locator;
  readonly emailAlerts: Locator;
  readonly emailSummary: Locator;
  readonly emailNews: Locator;

  /** "Your details stay in this browser only.", under the details form. */
  readonly savedHereLine: Locator;

  readonly errorSummary: Locator;
  readonly unsavedLine: Locator;
  readonly undoButton: Locator;
  readonly saveButton: Locator;
  readonly saveMessage: Locator;

  constructor(page: Page, options: PageObjectOptions = {}) {
    super(page, options);
    this.heading = page.getByRole('heading', { name: TEXT.profile.title, exact: true });
    this.form = page.getByTestId('profile-form');

    this.photoInput = page.getByLabel(TEXT.profile.photoLabel);
    this.photoDropZone = page.getByTestId('photo-drop-zone');
    this.photoPreview = page.getByTestId('photo-preview');
    this.removePhotoButton = page.getByRole('button', { name: TEXT.profile.removePhoto });
    this.photoMessage = page.getByTestId('photo-message');

    this.accountId = page.getByTestId('account-id');
    this.copyButton = page.getByTestId('copy-account-id');
    this.copyStatus = page.getByTestId('copy-status');

    this.darkTheme = page.getByRole('radio', { name: TEXT.profile.themeDark, exact: true });
    this.lightTheme = page.getByRole('radio', { name: TEXT.profile.themeLight, exact: true });
    this.deviceTheme = page.getByRole('radio', { name: TEXT.profile.themeDevice, exact: true });

    this.displayNameField = page.getByLabel(TEXT.profile.displayNameLabel);
    this.displayNameError = page.getByTestId('display-name-error');
    this.birthDateField = page.getByLabel(TEXT.profile.birthDateLabel);
    this.birthDateError = page.getByTestId('birth-date-error');
    this.countryField = page.getByLabel(TEXT.profile.countryLabel);
    this.sectorsField = page.getByLabel(TEXT.profile.sectorsLabel);
    this.sectorsError = page.getByTestId('sectors-error');

    this.selectAllEmails = page.getByRole('checkbox', { name: TEXT.profile.selectAll });
    this.emailAlerts = page.getByRole('checkbox', { name: TEXT.profile.emailAlerts });
    this.emailSummary = page.getByRole('checkbox', { name: TEXT.profile.emailSummary });
    this.emailNews = page.getByRole('checkbox', { name: TEXT.profile.emailNews });

    this.savedHereLine = page.getByText(TEXT.profile.savedHere, { exact: true });

    this.errorSummary = page.getByTestId('form-error-summary');
    this.unsavedLine = page.getByTestId('unsaved-changes');
    this.undoButton = page.getByRole('button', { name: TEXT.profile.undo });
    this.saveButton = page.getByRole('button', { name: TEXT.profile.save });
    this.saveMessage = page.getByTestId('save-message');
  }

  protected override readyElement(): Locator {
    return this.form;
  }

  async goto(): Promise<void> {
    await this.open('profile');
  }

  /** Asks for the Profile page without a session, so the app sends us to log in. */
  async gotoExpectingLogin(): Promise<void> {
    await this.openWithoutWaiting('profile');
  }

  /** One of the three email checkboxes. */
  emailChoice(which: EmailChoice): Locator {
    if (which === 'alerts') return this.emailAlerts;
    if (which === 'summary') return this.emailSummary;
    return this.emailNews;
  }

  /** The photo in the preview box. There is none until a photo is saved. */
  photoPreviewImage(): Locator {
    return this.photoPreview.locator('img');
  }

  /** Picks a file with the file input, the way the Choose a file button does. */
  async choosePhotoFile(file: { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
    await this.photoInput.setInputFiles(file);
  }

  /**
   * Drops files on the drop zone. A real drop carries a DataTransfer, and only
   * the page can make one, so it is built there and handed to the event.
   */
  async dropPhotoFiles(files: readonly DroppedFile[]): Promise<void> {
    const items = files.map((file) => ({
      name: file.name,
      mimeType: file.mimeType,
      bytes: [...file.bytes],
    }));

    const dataTransfer = await this.page.evaluateHandle(
      (dropped: { name: string; mimeType: string; bytes: number[] }[]) => {
        const transfer = new DataTransfer();
        for (const one of dropped) {
          transfer.items.add(
            new File([new Uint8Array(one.bytes)], one.name, { type: one.mimeType }),
          );
        }
        return transfer;
      },
      items,
    );

    await this.photoDropZone.dispatchEvent('drop', { dataTransfer });
    await dataTransfer.dispose();
  }

  /** Fills in the details form. Anything left out keeps the value it had. */
  async fillDetails(details: DetailsInput): Promise<void> {
    if (details.displayName !== undefined) await this.displayNameField.fill(details.displayName);
    if (details.birthDate !== undefined) await this.birthDateField.fill(details.birthDate);
    if (details.country !== undefined) await this.countryField.selectOption(details.country);
    if (details.sectors !== undefined) await this.sectorsField.selectOption([...details.sectors]);
  }

  /** The sectors picked right now, in the order the list shows them. */
  async pickedSectors(): Promise<string[]> {
    return this.sectorsField.evaluate((select) =>
      [...(select as HTMLSelectElement).selectedOptions].map((option) => option.value),
    );
  }

  /** True while the Select all box is half ticked. */
  async selectAllIsHalfTicked(): Promise<boolean> {
    return this.selectAllEmails.evaluate((box) => (box as HTMLInputElement).indeterminate);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async undo(): Promise<void> {
    await this.undoButton.click();
  }

  async copyAccountId(): Promise<void> {
    await this.copyButton.click();
  }

  async chooseTheme(theme: Theme): Promise<void> {
    if (theme === 'light') await this.lightTheme.check();
    else if (theme === 'device') await this.deviceTheme.check();
    else await this.darkTheme.check();
  }

  /** The data-theme the whole page is painted with: "dark" or "light". */
  async paintedTheme(): Promise<string | null> {
    return this.page.locator('html').getAttribute('data-theme');
  }
}
