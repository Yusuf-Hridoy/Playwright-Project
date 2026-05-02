const { test, expect } = require("../fixtures/base.fixture");
const env = require('../utils/Testoption');
const testData = require('../TestData/LoginData.json');
const checkoutData = require('../TestData/CheckoutData.json');

test.describe('End-to-End Checkout', () => {
    test.beforeEach(async ({ page, loginPage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await expect(page).toHaveTitle('Swag Labs');
    });

    test('should complete full purchase flow', async ({ homePage, cartPage, checkoutPage, checkoutOverviewPage }) => {
        await homePage.clickMenuButton();
        await homePage.addToCartBackpack();
        await expect(homePage.cartBadge).toHaveText('1');
        await homePage.clickShoppingCart();
        expect(await cartPage.getCartItems()).toBe(1);
        await cartPage.clickCheckoutButton();
        await checkoutPage.fillCheckoutInformation(
            checkoutData.valid.firstName,
            checkoutData.valid.lastName,
            checkoutData.valid.postalCode
        );
        await checkoutOverviewPage.clickFinishButton();
        const message = await checkoutOverviewPage.getConfirmationMessage();
        expect(message).toBe('Thank you for your order!');
    });
});
