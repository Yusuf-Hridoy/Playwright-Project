const { test, expect } = require("../fixtures/base.fixture");
const env = require('../utils/Testoption');
const testData = require('../TestData/LoginData.json');
const { generateCheckoutData } = require('../TestData/dataFactory');

test.describe('End-to-End Checkout', () => {
    test.beforeEach(async ({ page, loginPage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await expect(page).toHaveTitle('Swag Labs');
    });

    const checkoutScenarios = [
        { name: 'standard profile', data: generateCheckoutData() },
        { name: 'international-style profile', data: { firstName: 'Søren', lastName: 'Müller', postalCode: 'DK-2100' } },
    ];

    for (const scenario of checkoutScenarios) {
        test(`should complete full purchase flow with ${scenario.name}`, async ({ homePage, cartPage, checkoutPage, checkoutOverviewPage }) => {
            await homePage.clickMenuButton();
            await homePage.addToCartBackpack();
            await expect(homePage.cartBadge).toHaveText('1');
            await homePage.clickShoppingCart();
            expect(await cartPage.getCartItemsCount()).toBe(1);
            await cartPage.clickCheckoutButton();
            await checkoutPage.fillCheckoutInformation(
                scenario.data.firstName,
                scenario.data.lastName,
                scenario.data.postalCode
            );
            await checkoutOverviewPage.clickFinishButton();
            const message = await checkoutOverviewPage.getConfirmationMessage();
            expect(message).toBe('Thank you for your order!');
        });
    }
});
