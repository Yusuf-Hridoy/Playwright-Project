import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import { TEXT } from '../../data/expected-text';

/** How long the button says "Copied!" before it goes back, from the app. */
const COPIED_MS = 2_000;

test.describe('Copying the account ID', () => {
  test.use({ storageState: TRADER.storageState });

  // Only the chromium project runs @regression, and only Chromium lets a test
  // grant clipboard permission, so there is nothing to skip here.
  test('the button says Copied!, the clipboard holds the ID, and the label comes back', {
    tag: ['@regression'],
  }, async ({ context, profilePage, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await profilePage.goto();
    await expect(profilePage.accountId).toHaveText(TRADER.accountId);

    await profilePage.copyAccountId();

    await expect(profilePage.copyButton).toHaveText(TEXT.profile.copied);
    await expect(profilePage.copyStatus).toHaveText(TEXT.profile.copyDone);

    const onTheClipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(onTheClipboard).toBe(TRADER.accountId);

    await test.step('two seconds later the button is a button again', async () => {
      await page.clock.runFor(COPIED_MS);

      await expect(profilePage.copyButton).toHaveText(TEXT.profile.copyAccountId);
    });
  });

  test('a clipboard that refuses says so and offers the ID instead', {
    tag: ['@regression'],
  }, async ({ profilePage, page }) => {
    // The browser's own clipboard can refuse for all sorts of reasons. This
    // stands in for every one of them, before the page's scripts ever run.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: () => Promise.reject(new Error('the clipboard said no')),
        },
      });
    });

    await profilePage.goto();

    await profilePage.copyAccountId();

    await expect(profilePage.copyStatus).toHaveText(TEXT.profile.copyFailed);
    await expect(profilePage.copyButton).toHaveText(TEXT.profile.copyAccountId);
  });
});

test.describe('The theme', () => {
  test.use({ storageState: TRADER.storageState });

  test('Light stays light on the next page', { tag: ['@regression'] }, async ({
    profilePage,
    marketPage,
  }) => {
    await profilePage.goto();
    expect(await profilePage.paintedTheme()).toBe('dark');

    await profilePage.chooseTheme('light');

    expect(await profilePage.paintedTheme()).toBe('light');

    await test.step('the Market page is painted light too', async () => {
      await marketPage.goto();

      expect(await profilePage.paintedTheme()).toBe('light');
    });
  });

  test('Match my device follows the device both ways', { tag: ['@regression'] }, async ({
    profilePage,
    page,
  }) => {
    await profilePage.goto();

    await profilePage.chooseTheme('device');

    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('Start over and the profile', () => {
  test.use({ storageState: TRADER.storageState });

  test('starting over puts the display name and the theme back', { tag: ['@regression'] }, async ({
    accountState,
    walletPage,
    profilePage,
    topMenu,
  }) => {
    await accountState
      .forUser(TRADER)
      .withProfile({ displayName: 'Mira Khan', theme: 'light' })
      .apply();

    await walletPage.goto();
    await accountState.expectApplied();

    await expect(topMenu.profileLink).toHaveText('MK');
    expect(await profilePage.paintedTheme()).toBe('light');

    await walletPage.startOver();

    await expect(walletPage.startOverMessage()).toBeVisible();
    await expect(topMenu.profileLink).toHaveText(TRADER.initials);
    expect(await profilePage.paintedTheme()).toBe('dark');

    await test.step('and the Profile page shows the details it started with', async () => {
      await profilePage.goto();

      await expect(profilePage.displayNameField).toHaveValue(TRADER.profileStart.displayName);
      await expect(profilePage.darkTheme).toBeChecked();
    });
  });
});
