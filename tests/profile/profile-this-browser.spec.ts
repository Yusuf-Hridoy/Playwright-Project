// spec: specs/REQ-PROFILE-05.md
// seed: tests/seed.spec.ts

import { test, expect } from '../../fixtures/test-fixtures';
import { BASE_URL } from '../../config/environments';
import { LOCALE, MARKET_OPEN_TIME, TIME_ZONE } from '../../config/test-settings';
import { TRADER } from '../../data/demo-accounts';
import { TEXT } from '../../data/expected-text';
import { LoginPage } from '../../pages/login-page';
import { ProfilePage } from '../../pages/profile-page';
import { freezeClock } from '../../utils/frozen-clock';

/** A display name that is nothing like the one the account starts with. */
const NEW_NAME = 'Mira Khan';
const NEW_INITIALS = 'MK';

test.describe('Details saved in this browser', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'a second browser opens the details the account starts with, not the saved ones',
    { tag: ['@regression', '@p2', '@REQ-PROFILE-05'] },
    async ({ browser, profilePage, topMenu }) => {
      await profilePage.goto();

      // The app makes the promise on the page itself.
      await expect(profilePage.savedHereLine).toBeVisible();

      await test.step('this browser saves a new name and the light theme', async () => {
        await profilePage.fillDetails({ displayName: NEW_NAME });
        await profilePage.save();
        await profilePage.chooseTheme('light');

        await expect(profilePage.saveMessage).toHaveText(TEXT.profile.saved);
        await expect(topMenu.profileLink).toHaveText(NEW_INITIALS);
        expect(await profilePage.paintedTheme()).toBe('light');
      });

      // A second browser: its own storage, its own session, nothing shared.
      // The details were never sent anywhere, so there is nothing for it to
      // find but the details the account starts with.
      //
      // The empty storageState is not decoration. Inside a test, Playwright
      // folds the test's own context options into browser.newContext(), and
      // this file asks for a saved login, so without this the second browser
      // would open already signed in as the trader, with the first browser's
      // details and all.
      const secondBrowser = await browser.newContext({
        baseURL: BASE_URL,
        locale: LOCALE,
        timezoneId: TIME_ZONE,
        storageState: { cookies: [], origins: [] },
      });

      try {
        await test.step('a second browser starts fresh', async () => {
          const secondPage = await secondBrowser.newPage();
          await freezeClock(secondPage, MARKET_OPEN_TIME);

          const secondLogin = new LoginPage(secondPage);
          const secondProfile = new ProfilePage(secondPage);

          await secondLogin.goto();
          await secondLogin.logIn(TRADER.email, TRADER.password);
          await secondProfile.goto();

          await expect(secondProfile.displayNameField).toHaveValue(TRADER.profileStart.displayName);
          await expect(secondProfile.darkTheme).toBeChecked();
          expect(await secondProfile.paintedTheme()).toBe('dark');
          await expect(secondProfile.savedHereLine).toBeVisible();
        });
      } finally {
        await secondBrowser.close();
      }

      await test.step('and the first browser still has what it saved', async () => {
        await profilePage.goto();

        await expect(profilePage.displayNameField).toHaveValue(NEW_NAME);
        await expect(profilePage.lightTheme).toBeChecked();
        await expect(topMenu.profileLink).toHaveText(NEW_INITIALS);
      });
    },
  );
});
