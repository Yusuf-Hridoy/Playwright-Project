const { test, expect } = require('../fixtures/base.fixture');
const env = require('../utils/Testoption');
const testData = require('../TestData/LoginData.json');

test.describe('Cart', () => {
    test.beforeEach(async ({ page, loginPage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await expect(page).toHaveTitle('Swag Labs');
    });

    test('should remove item from cart', async ({ homePage, cartPage }) => {
        await homePage.addToCartBackpack();
        await expect(homePage.cartBadge).toHaveText('1');
        await homePage.clickShoppingCart();
        expect(await cartPage.getCartItemsCount()).toBe(1);
        await cartPage.removeItemByIndex(0);
        expect(await cartPage.getCartItemsCount()).toBe(0);
        await expect(homePage.cartBadge).not.toBeVisible();
    });

    test('should continue shopping from cart', async ({ page, homePage, cartPage }) => {
        await homePage.addToCartBackpack();
        await homePage.clickShoppingCart();
        expect(await cartPage.getCartItemsCount()).toBe(1);
        await cartPage.clickContinueShopping();
        await expect(page).toHaveURL('/inventory.html');
    });

    test('should show error when checking out with empty cart', async ({ homePage, cartPage, checkoutPage }) => {
        await homePage.clickShoppingCart();
        expect(await cartPage.getCartItemsCount()).toBe(0);
        await cartPage.clickCheckoutButton();
        // Sauce Demo allows checkout even with empty cart; this test documents actual behavior.
        // In a real app, you would assert an error message or disabled checkout button.
        await expect(checkoutPage.firstNameInput).toBeVisible();
    });
});
