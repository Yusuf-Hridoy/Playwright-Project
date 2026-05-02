const { test, expect } = require("../fixtures/base.fixture");
const env = require('../utils/Testoption');
const testData = require('../TestData/LoginData.json');

test.describe('Product Sorting', () => {
    test.beforeEach(async ({ page, loginPage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await expect(page).toHaveTitle('Swag Labs');
    });

    test('should sort products by price low to high', async ({ homePage }) => {
        await homePage.sortBy('lohi');
        const prices = await homePage.getProductPrices();
        // Convert price strings like "$29.99" to numbers
        const numericPrices = prices.map(p => parseFloat(p.replace('$', '')));
        // Assert prices are sorted ascending
        for (let i = 0; i < numericPrices.length - 1; i++) {
            expect(numericPrices[i]).toBeLessThanOrEqual(numericPrices[i + 1]);
        }
    });
});
