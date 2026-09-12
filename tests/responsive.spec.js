const { test, expect } = require('../fixtures/base.fixture');
const env = require('../utils/Testoption');
const testData = require('../TestData/LoginData.json');

/**
 * Responsive testing (imple.md 5.3) — runs at every viewport the suite is
 * executed with (desktop in chromium/firefox/webkit, plus the dedicated
 * `Tablet` and `Mobile Landscape` projects in playwright.config.js).
 * Assertions adapt to the project viewport so the same spec covers
 * mobile, tablet and desktop breakpoints.
 */
test.describe('Responsive layout @visual @regression', () => {
    test.beforeEach(async ({ page, loginPage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await expect(page).toHaveTitle('Swag Labs');
    });

    test('page has no horizontal overflow at current viewport', async ({ page }) => {
        const metrics = await page.evaluate(() => ({
            viewportWidth: window.innerWidth,
            scrollWidth: document.scrollingElement.scrollWidth,
        }));
        expect(
            metrics.scrollWidth,
            `horizontal overflow of ${metrics.scrollWidth - metrics.viewportWidth}px at ${metrics.viewportWidth}px viewport`
        ).toBeLessThanOrEqual(metrics.viewportWidth);
    });

    test('product layout adapts its column count to the viewport', async ({ page }) => {
        const viewportWidth = page.viewportSize().width;

        // The inventory list is a wrapping flex row: count how many product cards
        // share the first row's vertical position to derive the real column count.
        const columnCount = await page.evaluate(() => {
            const items = [...document.querySelectorAll('.inventory_item')];
            if (items.length === 0) return 0;
            const firstTop = items[0].getBoundingClientRect().top;
            return items.filter((i) => Math.abs(i.getBoundingClientRect().top - firstTop) < 2).length;
        });

        if (viewportWidth < 1000) {
            // narrow viewports must stack products in a single column
            expect(columnCount, `expected 1 column at ${viewportWidth}px, got ${columnCount}`).toBe(1);
        } else {
            // wide screens lay products out in multiple columns
            expect(columnCount, `expected multiple columns at ${viewportWidth}px, got ${columnCount}`).toBeGreaterThan(1);
        }
    });

    test('primary actions stay visible and usable at current viewport', async ({ homePage, page }) => {
        const viewportWidth = page.viewportSize().width;

        await expect(homePage.menuButton).toBeVisible();
        await expect(homePage.shoppingCart).toBeVisible();
        await expect(homePage.sortingDropdown).toBeVisible();

        const firstAddButton = homePage.addToCartButtons.first();
        await expect(firstAddButton).toBeVisible();
        await expect(firstAddButton).toBeEnabled();

        // the button must actually sit inside the viewport (no off-screen CTAs)
        const box = await firstAddButton.boundingBox();
        expect(box.x + box.width, `add-to-cart button overflows viewport at ${viewportWidth}px`).toBeLessThanOrEqual(viewportWidth);
    });
});
