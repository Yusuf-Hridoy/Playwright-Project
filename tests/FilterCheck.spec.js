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
        const numericPrices = prices.map(p => parseFloat(p.replace('$', '')));
        for (let i = 0; i < numericPrices.length - 1; i++) {
            expect(numericPrices[i]).toBeLessThanOrEqual(numericPrices[i + 1]);
        }
    });

    test('should sort products by price high to low', async ({ homePage }) => {
        await homePage.sortBy('hilo');
        const prices = await homePage.getProductPrices();
        const numericPrices = prices.map(p => parseFloat(p.replace('$', '')));
        for (let i = 0; i < numericPrices.length - 1; i++) {
            expect(numericPrices[i]).toBeGreaterThanOrEqual(numericPrices[i + 1]);
        }
    });

    test('should sort products by name A to Z', async ({ homePage }) => {
        await homePage.sortBy('az');
        const names = await homePage.getProductNames();
        const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
        expect(names).toEqual(sortedNames);
    });

    test('should sort products by name Z to A', async ({ homePage }) => {
        await homePage.sortBy('za');
        const names = await homePage.getProductNames();
        const sortedNames = [...names].sort((a, b) => b.localeCompare(a));
        expect(names).toEqual(sortedNames);
    });
});
