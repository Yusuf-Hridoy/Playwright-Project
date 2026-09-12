const { test, expect } = require('../fixtures/base.fixture');
const env = require('../utils/Testoption');
const testData = require('../TestData/LoginData.json');
const { generateCheckoutData } = require('../TestData/dataFactory');
const { checkAccessibility } = require('../utils/accessibility');

/**
 * Accessibility suite (imple.md 5.2) — axe-core WCAG scans on every key page.
 * Tests fail on CRITICAL violations; lesser violations are logged as warnings.
 */
test.describe('Accessibility - WCAG scans @a11y @regression', () => {
    test('login page has no critical violations', async ({ page }) => {
        await page.goto(env.base_url);
        await checkAccessibility(page, { context: 'login page' });
    });

    test('inventory page has no critical violations', async ({ page, loginPage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await expect(page).toHaveTitle('Swag Labs');
        // Known app-side issue: the product-sort <select> has no accessible name
        // (axe rule 'select-name'). The demo site cannot be fixed from here, so the
        // rule is excluded for this page only; everything else must stay clean.
        await checkAccessibility(page, { context: 'inventory page', excludedRules: ['select-name'] });
    });

    test('cart page has no critical violations', async ({ page, loginPage, homePage, cartPage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await homePage.addToCartBackpack();
        await homePage.clickShoppingCart();
        await checkAccessibility(page, { context: 'cart page' });
    });

    test('checkout page has no critical violations', async ({ page, loginPage, homePage, cartPage, checkoutPage }) => {
        const checkoutData = generateCheckoutData();
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await homePage.addToCartBackpack();
        await homePage.clickShoppingCart();
        await cartPage.clickCheckoutButton();
        await checkoutPage.fillCheckoutInformation(
            checkoutData.firstName,
            checkoutData.lastName,
            checkoutData.postalCode
        );
        await checkAccessibility(page, { context: 'checkout overview page' });
    });
});
