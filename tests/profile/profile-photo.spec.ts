import path from 'node:path';
import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import { TEXT } from '../../data/expected-text';

/** The one photo this repository keeps: 24x24, about 100 bytes. */
const SMALL_PHOTO = path.join(__dirname, '..', '..', 'test-files', 'small-photo.png');

/** The app's limit is 1 MB (js/profile-storage.js). This is just over it. */
const TOO_BIG_BYTES = Math.round(1.1 * 1024 * 1024);

test.describe('The profile photo', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'a small photo is saved at once, shows in the menu and survives a reload',
    {
      tag: ['@regression', '@p2', '@REQ-PROFILE-01'],
    },
    async ({ profilePage, topMenu, page }) => {
      await profilePage.goto();

      await expect(profilePage.photoPreviewImage()).toHaveCount(0);
      await expect(topMenu.profileLink).toHaveText(TRADER.initials);

      await profilePage.photoInput.setInputFiles(SMALL_PHOTO);

      await expect(profilePage.photoMessage).toHaveText(TEXT.profile.photoSaved);
      await expect(profilePage.photoPreviewImage()).toBeVisible();
      await expect(profilePage.removePhotoButton).toBeVisible();
      await expect(topMenu.profilePhoto()).toBeVisible();

      await test.step('it is still there after a reload', async () => {
        await page.reload();
        await profilePage.waitUntilReady();

        await expect(profilePage.photoPreviewImage()).toBeVisible();
        await expect(topMenu.profilePhoto()).toBeVisible();
      });
    },
  );

  test(
    'a text file is refused as the wrong kind of file',
    { tag: ['@regression', '@p2', '@REQ-PROFILE-01'] },
    async ({ profilePage }) => {
      await profilePage.goto();

      // Built here rather than committed: the point of the file is its type.
      await profilePage.photoInput.setInputFiles({
        name: 'notes.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('This is not a photo.', 'utf8'),
      });

      await expect(profilePage.photoMessage).toHaveText(TEXT.profile.wrongType);
      await expect(profilePage.photoPreviewImage()).toHaveCount(0);
      await expect(profilePage.removePhotoButton).toBeHidden();
    },
  );

  test(
    'a photo over 1 MB is refused as too big',
    { tag: ['@regression', '@p2', '@REQ-PROFILE-01'] },
    async ({ profilePage }) => {
      await profilePage.goto();

      // 1.1 MB of nothing in particular. A real 1.1 MB image in the repository
      // would cost a megabyte to say the same thing.
      await profilePage.photoInput.setInputFiles({
        name: 'huge.png',
        mimeType: 'image/png',
        buffer: Buffer.alloc(TOO_BIG_BYTES),
      });

      await expect(profilePage.photoMessage).toHaveText(TEXT.profile.tooBig);
      await expect(profilePage.photoPreviewImage()).toHaveCount(0);
    },
  );

  test(
    'dropping two photos at once is refused',
    { tag: ['@regression', '@p2', '@REQ-PROFILE-01'] },
    async ({ profilePage }) => {
      await profilePage.goto();

      await profilePage.dropPhotoFiles([
        { name: 'one.png', mimeType: 'image/png', bytes: Buffer.from([1, 2, 3]) },
        { name: 'two.png', mimeType: 'image/png', bytes: Buffer.from([4, 5, 6]) },
      ]);

      await expect(profilePage.photoMessage).toHaveText(TEXT.profile.oneAtATime);
      await expect(profilePage.photoPreviewImage()).toHaveCount(0);
    },
  );
});
