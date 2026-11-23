// The news box on the Market page.
//
// Everything the box draws lives inside an open shadow root. Playwright's
// getByTestId and getByRole walk through an open boundary by themselves, so
// these tests look no different from any other, and one of them proves the
// boundary really is there.

import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import { TEXT } from '../../data/expected-text';

/** The box shows the three newest headlines. */
const BOX_COUNT = 3;

test.describe('The news box on the Market page', () => {
  test.use({ storageState: TRADER.storageState });

  test(
    'shows the three newest headlines, inside an open shadow root',
    {
      tag: ['@regression', '@p3', '@REQ-NEWS-01'],
    },
    async ({ marketPage, newsPage }) => {
      const box = marketPage.newsBox;

      await marketPage.goto();

      await expect(box.items).toHaveCount(BOX_COUNT);
      expect(
        await box.hasOpenShadowRoot(),
        'The box is meant to draw itself inside an open shadow root.',
      ).toBe(true);

      const boxHeadlines = await box.headlines();

      await test.step('they are the same three the News page puts at the top', async () => {
        await newsPage.goto();

        const pageHeadlines = await newsPage.headlines();

        expect(boxHeadlines).toEqual(pageHeadlines.slice(0, BOX_COUNT));
      });
    },
  );

  test(
    'Hide and Show move aria-expanded, and the choice survives a reload',
    {
      tag: ['@regression', '@p3', '@REQ-NEWS-01'],
    },
    async ({ marketPage }) => {
      const box = marketPage.newsBox;

      await marketPage.goto();

      await expect(box.toggleButton).toHaveText(TEXT.news.hide);
      await expect(box.toggleButton).toHaveAttribute('aria-expanded', 'true');
      await expect(box.items).toHaveCount(BOX_COUNT);

      await test.step('Hide folds the box away', async () => {
        await box.toggle();

        await expect(box.toggleButton).toHaveText(TEXT.news.show);
        await expect(box.toggleButton).toHaveAttribute('aria-expanded', 'false');
        await expect(box.items).toHaveCount(0);
        await expect(box.seeAllLink).toBeHidden();
      });

      await test.step('and it is still folded away after a reload', async () => {
        await marketPage.goto();

        await expect(box.toggleButton).toHaveText(TEXT.news.show);
        await expect(box.toggleButton).toHaveAttribute('aria-expanded', 'false');
        await expect(box.items).toHaveCount(0);
      });

      await test.step('Show brings the headlines back, and that sticks too', async () => {
        await box.toggle();

        await expect(box.toggleButton).toHaveText(TEXT.news.hide);
        await expect(box.toggleButton).toHaveAttribute('aria-expanded', 'true');
        await expect(box.items).toHaveCount(BOX_COUNT);

        await marketPage.goto();

        await expect(box.toggleButton).toHaveAttribute('aria-expanded', 'true');
        await expect(box.items).toHaveCount(BOX_COUNT);
      });
    },
  );

  test(
    'a headline opens its own item on the News page, open, in view and focused',
    {
      tag: ['@regression', '@p3', '@REQ-NEWS-01'],
    },
    async ({ marketPage, newsPage, page }) => {
      const box = marketPage.newsBox;

      await marketPage.goto();
      await expect(box.items).toHaveCount(BOX_COUNT);

      const ids = await box.itemIds();
      const wanted = ids[0] ?? '';
      const headlineText = (await box.link(wanted).innerText()).trim();

      await box.openItem(wanted);

      await newsPage.waitUntilReady();
      await expect(page).toHaveURL(new RegExp(`focus=${wanted}\\b`));

      const item = newsPage.item(wanted);
      const headline = newsPage.headline(wanted);

      await expect(headline).toHaveText(headlineText);
      await expect(newsPage.summary(wanted)).toBeVisible();
      await expect(newsPage.readMoreButton(wanted)).toHaveAttribute('aria-expanded', 'true');
      await expect(newsPage.readMoreButton(wanted)).toHaveText(TEXT.news.showLess);
      await expect(item).toBeInViewport();
      await expect(headline).toBeFocused();
    },
  );
});
