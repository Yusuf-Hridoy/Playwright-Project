// The News page: ten headlines at a time, a filter per stock, a summary behind
// each "Read more", and a "Back to top" once the page is long.
//
// Loading more is a one second setTimeout in the app, so these tests move the
// clock with page.clock.runFor() instead of waiting for anything.

import { test, expect } from '../../fixtures/test-fixtures';
import { TRADER } from '../../data/demo-accounts';
import { TEXT, newsCountText } from '../../data/expected-text';

/** All 60 made-up headlines, from ../Practice-App/data/news-templates.json. */
const NEWS_TOTAL = 60;
/** NEWS_PAGE_SIZE in js/news-engine.js. */
const PAGE_SIZE = 10;
/** LOAD_WAIT_MS in js/pages/news-page.js: how long "Loading more news…" shows. */
const LOAD_WAIT_MS = 1_000;
/** Six of the 60 headlines belong to KRYL, which is less than one page. */
const KRYL_COUNT = 6;
/** BACK_TO_TOP_AFTER_PX in js/pages/news-page.js. */
const BACK_TO_TOP_AFTER_PX = 600;

test.describe('The News page', () => {
  test.use({ storageState: TRADER.storageState });

  test('opens with ten headlines, and says so above them', { tag: ['@regression'] }, async ({
    newsPage,
  }) => {
    await newsPage.goto();

    await expect(newsPage.items).toHaveCount(PAGE_SIZE);
    await expect(newsPage.countLine).toHaveText(newsCountText(PAGE_SIZE, NEWS_TOTAL));
    await expect(newsPage.endLine).toBeHidden();
  });

  test('scrolling loads ten more a second later, and leaves the first one alone', {
    tag: ['@regression'],
  }, async ({ newsPage, page }) => {
    await newsPage.goto();
    await expect(newsPage.items).toHaveCount(PAGE_SIZE);

    // Held on to before the next page arrives, so the test can ask afterwards
    // whether this is still the very same element or a rebuilt copy of it.
    const firstBefore = await newsPage.items.first().elementHandle();
    if (firstBefore === null) throw new Error('The first headline is not on the page.');
    const idsBefore = await newsPage.itemIds();

    await newsPage.scrollToEnd();

    await expect(newsPage.loadingLine).toBeVisible();
    await expect(newsPage.loadingLine).toHaveText(TEXT.news.loading);
    await expect(newsPage.items).toHaveCount(PAGE_SIZE);

    await page.clock.runFor(LOAD_WAIT_MS);

    await expect(newsPage.items).toHaveCount(PAGE_SIZE * 2);
    await expect(newsPage.loadingLine).toBeHidden();
    await expect(newsPage.countLine).toHaveText(newsCountText(PAGE_SIZE * 2, NEWS_TOTAL));

    await test.step('the ten that were already there are untouched', async () => {
      expect(
        await firstBefore.evaluate((element) => element.isConnected),
        'The first headline was replaced, so the list was rebuilt instead of added to.',
      ).toBe(true);

      const idsAfter = await newsPage.itemIds();

      expect(idsAfter.slice(0, PAGE_SIZE)).toEqual(idsBefore);
    });
  });

  test('keeps loading until all 60 are shown, then stops and says so', {
    tag: ['@regression'],
  }, async ({ newsPage, page }) => {
    await newsPage.goto();

    let shown = PAGE_SIZE;
    while (shown < NEWS_TOTAL) {
      await newsPage.scrollToEnd();
      await expect(newsPage.loadingLine).toBeVisible();

      await page.clock.runFor(LOAD_WAIT_MS);

      shown += PAGE_SIZE;
      await expect(newsPage.items).toHaveCount(shown);
    }

    await expect(newsPage.items).toHaveCount(NEWS_TOTAL);
    await expect(newsPage.countLine).toHaveText(newsCountText(NEWS_TOTAL, NEWS_TOTAL));
    await expect(newsPage.endLine).toBeVisible();
    await expect(newsPage.endLine).toHaveText(TEXT.news.end);

    await test.step('scrolling again asks for nothing more', async () => {
      await newsPage.scrollToEnd();

      await expect(newsPage.loadingLine).toBeHidden();

      await page.clock.runFor(LOAD_WAIT_MS * 5);

      await expect(newsPage.items).toHaveCount(NEWS_TOTAL);
      await expect(newsPage.endLine).toBeVisible();
    });
  });

  test('the KRYL filter shows only KRYL, writes it into the link, and Back undoes it', {
    tag: ['@regression'],
  }, async ({ newsPage, page }) => {
    const symbol = 'KRYL';

    await newsPage.goto();
    await expect(newsPage.filter('ALL')).toHaveAttribute('aria-pressed', 'true');

    await newsPage.filterBy(symbol);

    await expect(newsPage.items).toHaveCount(KRYL_COUNT);
    expect(await newsPage.itemStocks()).toEqual(Array(KRYL_COUNT).fill(symbol));
    await expect(newsPage.countLine).toHaveText(newsCountText(KRYL_COUNT, KRYL_COUNT));
    await expect(newsPage.filter(symbol)).toHaveAttribute('aria-pressed', 'true');
    await expect(newsPage.filter('ALL')).toHaveAttribute('aria-pressed', 'false');
    await expect(newsPage.endLine).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`stock=${symbol}\\b`));

    await test.step('Back goes to All again', async () => {
      await page.goBack();

      await expect(newsPage.items).toHaveCount(PAGE_SIZE);
      await expect(newsPage.countLine).toHaveText(newsCountText(PAGE_SIZE, NEWS_TOTAL));
      await expect(newsPage.filter('ALL')).toHaveAttribute('aria-pressed', 'true');
      await expect(newsPage.filter(symbol)).toHaveAttribute('aria-pressed', 'false');
      await expect(page).not.toHaveURL(/stock=/);
    });
  });

  test('"Read more" opens one summary, and "Show less" puts it away', {
    tag: ['@regression'],
  }, async ({ newsPage }) => {
    await newsPage.goto();

    const ids = await newsPage.itemIds();
    const id = ids[0] ?? '';
    const button = newsPage.readMoreButton(id);
    const summary = newsPage.summary(id);

    await expect(button).toHaveText(TEXT.news.readMore);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(summary).toBeHidden();

    await newsPage.toggleSummary(id);

    await expect(button).toHaveText(TEXT.news.showLess);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(summary).toBeVisible();
    await expect(summary).not.toBeEmpty();

    await test.step('and the other headlines are left closed', async () => {
      const other = ids[1] ?? '';

      await expect(newsPage.readMoreButton(other)).toHaveAttribute('aria-expanded', 'false');
      await expect(newsPage.summary(other)).toBeHidden();
    });

    await newsPage.toggleSummary(id);

    await expect(button).toHaveText(TEXT.news.readMore);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(summary).toBeHidden();
  });

  test('"Back to top" shows up once the page is long, and hands focus to the heading', {
    tag: ['@regression'],
  }, async ({ newsPage }) => {
    await newsPage.goto();

    await expect(newsPage.backToTopButton).toBeHidden();

    await newsPage.scrollToEnd();

    expect(
      await newsPage.scrollY(),
      `"Back to top" only appears past ${BACK_TO_TOP_AFTER_PX}px, so the page has to be longer than that.`,
    ).toBeGreaterThan(BACK_TO_TOP_AFTER_PX);
    await expect(newsPage.backToTopButton).toBeVisible();

    await newsPage.backToTop();

    await expect(newsPage.heading).toBeFocused();
    expect(await newsPage.scrollY()).toBe(0);
    await expect(newsPage.backToTopButton).toBeHidden();
  });

  test('the same seed gives the same ten headlines, and another seed a different order', {
    tag: ['@regression'],
  }, async ({ newsPage }) => {
    await newsPage.goto();
    const first = await newsPage.headlines();

    expect(first).toHaveLength(PAGE_SIZE);

    await test.step('opening it again, at the same frozen moment, changes nothing', async () => {
      await newsPage.goto();

      expect(await newsPage.headlines()).toEqual(first);
    });

    await test.step('a different seed shuffles them', async () => {
      await newsPage.goto({ seed: '7' });

      const other = await newsPage.headlines();

      expect(other).toHaveLength(PAGE_SIZE);
      expect(other).not.toEqual(first);
    });
  });
});
