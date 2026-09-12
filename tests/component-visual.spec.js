const { test, expect } = require('../fixtures/base.fixture');
const env = require('../utils/Testoption');
const testData = require('../TestData/LoginData.json');
const percySnapshot = require('@percy/playwright');

/**
 * Component-level visual tests (imple.md 5.5).
 * Captures isolated visual states of reusable UI components (login form,
 * product card, cart badge/item) so they can be reviewed independently of
 * full-page snapshots. All snapshots are namespaced "Component / ..." and
 * captured at phone + desktop widths.
 *
 * Note: without PERCY_TOKEN these calls are no-ops; run via
 * `npx percy exec -- npx playwright test --grep @visual`.
 */
const SNAPSHOT_WIDTHS = [375, 1280];

test.describe('Component visual states @visual @regression', () => {
    test('login form component', async ({ page }) => {
        await page.goto(env.base_url);
        await percySnapshot(page, 'Component / Login Form', { widths: SNAPSHOT_WIDTHS });
    });

    test('login form error state component', async ({ page, loginPage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.invalidPassword.username, testData.invalidPassword.password);
        await expect(loginPage.errorMessage).toBeVisible();
        await percySnapshot(page, 'Component / Login Form - Error State', { widths: SNAPSHOT_WIDTHS });
    });

    test('product card component', async ({ page, loginPage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await expect(page).toHaveTitle('Swag Labs');
        await percySnapshot(page, 'Component / Product Card - Default', { widths: SNAPSHOT_WIDTHS });

        await page.locator("[data-test='add-to-cart-sauce-labs-backpack']").click();
        await percySnapshot(page, 'Component / Product Card - Added To Cart', { widths: SNAPSHOT_WIDTHS });
    });

    test('cart badge & cart item components', async ({ page, loginPage, homePage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await homePage.addToCartBackpack();
        await expect(homePage.cartBadge).toHaveText('1');
        await percySnapshot(page, 'Component / Cart Badge', { widths: [375] });

        await homePage.clickShoppingCart();
        await percySnapshot(page, 'Component / Cart Item', { widths: SNAPSHOT_WIDTHS });
    });
});
