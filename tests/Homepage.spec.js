const { test, expect } = require("../fixtures/base.fixture");
const env = require('../utils/Testoption');
const testData = require('../TestData/LoginData.json');

test.describe('Homepage', () => {
    test.beforeEach(async ({ page, loginPage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await expect(page).toHaveTitle('Swag Labs');
    });

    test('should add backpack to cart and display cart badge', async ({ homePage, cartPage }) => {
        await homePage.clickMenuButton();
        await homePage.addToCartBackpack();
        await expect(homePage.cartBadge).toHaveText('1');
        await homePage.clickShoppingCart();
        expect(await cartPage.getCartItems()).toBe(1);
    });
});
