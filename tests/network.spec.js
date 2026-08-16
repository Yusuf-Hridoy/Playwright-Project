const { test, expect } = require('../fixtures/base.fixture');
const env = require('../utils/Testoption');
const { slowDownRequests, mockAPIResponse } = require('../utils/network');
const testData = require('../TestData/LoginData.json');

test.describe('Network Interception', () => {
    test.beforeEach(async ({ page, loginPage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await expect(page).toHaveTitle('Swag Labs');
    });

    test('should handle mocked slow inventory images gracefully', async ({ page }) => {
        await slowDownRequests(page, '**/*.png', 1000);

        // Page should still load and products should be visible
        await expect(page.locator('.inventory_item')).toHaveCount(6);
    });

    test('should mock a hypothetical inventory API with custom data', async ({ page }) => {
        // Mock a fictional API endpoint to demonstrate the mocking utility.
        // In a real application, replace this with an actual API used by the app.
        await mockAPIResponse(page, '**/api/inventory', {
            items: [
                { id: 1, name: 'Mocked Backpack', price: 9.99 },
            ],
        });

        // Trigger a request to the mocked endpoint from the page context
        const response = await page.evaluate(async () => {
            const res = await fetch('/api/inventory');
            return res.json();
        });

        expect(response.items).toHaveLength(1);
        expect(response.items[0].name).toBe('Mocked Backpack');
    });
});
