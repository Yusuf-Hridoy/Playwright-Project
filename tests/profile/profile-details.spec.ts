import { test, expect } from '../../fixtures/test-fixtures';
import { MIN_AGE, TRADER } from '../../data/demo-accounts';
import { TEXT, problemsMessage } from '../../data/expected-text';
import { MARKET_DAY } from '../../config/test-settings';

/** The day the frozen clock stands on, in Dhaka time. */
const [TODAY_YEAR, TODAY_MONTH, TODAY_DAY] = MARKET_DAY.split('-') as [string, string, string];

/** Born on this day, a person turns 18 on the frozen clock's day exactly. */
const EIGHTEEN_TODAY = `${Number(TODAY_YEAR) - MIN_AGE}-${TODAY_MONTH}-${TODAY_DAY}`;
/** One day later, and they are still 17. */
const EIGHTEEN_TOMORROW = `${Number(TODAY_YEAR) - MIN_AGE}-${TODAY_MONTH}-${String(Number(TODAY_DAY) + 1).padStart(2, '0')}`;

const TOO_MANY_SECTORS = ['Energy', 'Robotics', 'Food', 'Health'];

test.describe('The details form', () => {
  test.use({ storageState: TRADER.storageState });

  test('it opens with the saved details, and Select all is half ticked', {
    tag: ['@regression'],
  }, async ({ profilePage }) => {
    const saved = TRADER.profileStart;

    await profilePage.goto();

    await expect(profilePage.displayNameField).toHaveValue(saved.displayName);
    await expect(profilePage.birthDateField).toHaveValue(saved.birthDate);
    await expect(profilePage.countryField).toHaveValue(saved.country);
    expect(await profilePage.pickedSectors()).toEqual(saved.sectors);

    await expect(profilePage.emailAlerts).toBeChecked();
    await expect(profilePage.emailSummary).not.toBeChecked();
    await expect(profilePage.emailNews).not.toBeChecked();

    await expect(profilePage.selectAllEmails).not.toBeChecked();
    expect(await profilePage.selectAllIsHalfTicked()).toBe(true);

    await expect(profilePage.unsavedLine).toBeHidden();
    await expect(profilePage.saveMessage).toBeEmpty();
  });

  test('three bad fields give three errors, a summary and the focus', {
    tag: ['@regression'],
  }, async ({ profilePage }) => {
    await profilePage.goto();

    await profilePage.fillDetails({
      displayName: '!',
      birthDate: '2015-06-01',
      sectors: TOO_MANY_SECTORS,
    });

    await profilePage.save();

    await expect(profilePage.displayNameError).toHaveText(TEXT.profile.displayNameError);
    await expect(profilePage.birthDateError).toHaveText(TEXT.profile.birthDateYoung);
    await expect(profilePage.sectorsError).toHaveText(TEXT.profile.sectorsTooMany);
    await expect(profilePage.errorSummary).toHaveText(problemsMessage(3));

    await expect(profilePage.displayNameField).toBeFocused();
    await expect(profilePage.displayNameField).toHaveAttribute('aria-invalid', 'true');
    await expect(profilePage.saveMessage).toBeEmpty();
  });

  test(`turning ${MIN_AGE} today is allowed, and a day short of it is not`, {
    tag: ['@regression'],
  }, async ({ profilePage }) => {
    await profilePage.goto();

    await profilePage.fillDetails({ birthDate: EIGHTEEN_TODAY });
    await profilePage.save();

    await expect(profilePage.birthDateError).toBeEmpty();
    await expect(profilePage.saveMessage).toHaveText(TEXT.profile.saved);
    await expect(profilePage.birthDateField).toHaveValue(EIGHTEEN_TODAY);

    await test.step('one day younger is too young', async () => {
      await profilePage.fillDetails({ birthDate: EIGHTEEN_TOMORROW });
      await profilePage.save();

      await expect(profilePage.birthDateError).toHaveText(TEXT.profile.birthDateYoung);
      await expect(profilePage.errorSummary).toHaveText(problemsMessage(1));
    });
  });

  test('Select all ticks the three email choices, then clears them', {
    tag: ['@regression'],
  }, async ({ profilePage }) => {
    await profilePage.goto();

    await profilePage.selectAllEmails.click();

    await expect(profilePage.emailAlerts).toBeChecked();
    await expect(profilePage.emailSummary).toBeChecked();
    await expect(profilePage.emailNews).toBeChecked();
    await expect(profilePage.selectAllEmails).toBeChecked();
    expect(await profilePage.selectAllIsHalfTicked()).toBe(false);

    await test.step('pressing it again clears all three', async () => {
      await profilePage.selectAllEmails.click();

      await expect(profilePage.emailAlerts).not.toBeChecked();
      await expect(profilePage.emailSummary).not.toBeChecked();
      await expect(profilePage.emailNews).not.toBeChecked();
      await expect(profilePage.selectAllEmails).not.toBeChecked();
      expect(await profilePage.selectAllIsHalfTicked()).toBe(false);
    });
  });

  test('saving a new display name changes the initials in the menu with no reload', {
    tag: ['@regression'],
  }, async ({ profilePage, topMenu }) => {
    await profilePage.goto();
    await expect(topMenu.profileLink).toHaveText(TRADER.initials);

    await profilePage.fillDetails({ displayName: 'Mira Khan' });
    await profilePage.save();

    await expect(profilePage.saveMessage).toHaveText(TEXT.profile.saved);
    await expect(topMenu.profileLink).toHaveText('MK');
    await expect(profilePage.unsavedLine).toBeHidden();
  });

  test('leaving with unsaved changes warns, and Undo puts the saved details back', {
    tag: ['@regression'],
  }, async ({ profilePage, page }) => {
    const saved = TRADER.profileStart;

    await profilePage.goto();

    await profilePage.fillDetails({ displayName: 'Someone Else' });

    await expect(profilePage.unsavedLine).toBeVisible();
    await expect(profilePage.unsavedLine).toHaveText(TEXT.profile.unsaved);
    await expect(profilePage.undoButton).toBeVisible();

    await test.step('leaving the page asks the browser to warn', async () => {
      const warned = new Promise<string>((resolve) => {
        page.once('dialog', (dialog) => {
          resolve(dialog.type());
          void dialog.dismiss();
        });
      });

      // Closing with runBeforeUnload lets the page's own beforeunload run.
      // Dismissing the warning means staying, so the page is still here after.
      await page.close({ runBeforeUnload: true });

      expect(await warned).toBe('beforeunload');
      await expect(profilePage.displayNameField).toHaveValue('Someone Else');
    });

    await test.step('Undo changes puts everything back', async () => {
      await profilePage.undo();

      await expect(profilePage.displayNameField).toHaveValue(saved.displayName);
      await expect(profilePage.birthDateField).toHaveValue(saved.birthDate);
      expect(await profilePage.pickedSectors()).toEqual(saved.sectors);
      await expect(profilePage.unsavedLine).toBeHidden();
      await expect(profilePage.undoButton).toBeHidden();
    });
  });
});
