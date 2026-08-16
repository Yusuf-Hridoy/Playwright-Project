const { test, expect } = require('../fixtures/base.fixture');
const env = require('../utils/Testoption');
const testData = require('../TestData/LoginData.json');
const percySnapshot = require('@percy/playwright');

test.describe('Login', () => {
    test('visual snapshot - login page', async ({ page }) => {
        await page.goto(env.base_url);
        await percySnapshot(page, 'Login Page');
    });

    test('valid login', async ({ page, loginPage }) => {
        await loginPage.goto(env.base_url);
        await loginPage.login(testData.validUser.username, testData.validUser.password);
        await expect(page).toHaveTitle('Swag Labs');
        await percySnapshot(page, 'Homepage - Logged In');
    });

    const invalidLoginScenarios = [
        {
            name: 'wrong password',
            user: testData.invalidPassword,
            snapshotName: 'Login - Wrong Password Error',
        },
        {
            name: 'wrong username',
            user: testData.invalidUsername,
            snapshotName: 'Login - Wrong Username Error',
        },
        {
            name: 'locked out user',
            user: testData.lockedOutUser,
            snapshotName: 'Login - Locked Out User Error',
        },
    ];

    for (const scenario of invalidLoginScenarios) {
        test(`${scenario.name} shows error message`, async ({ page, loginPage }) => {
            await loginPage.goto(env.base_url);
            await loginPage.login(scenario.user.username, scenario.user.password);
            const errorMessage = await loginPage.getErrorMessage();
            expect(errorMessage).toBe(scenario.user.errorMessage);
            await percySnapshot(page, scenario.snapshotName);
        });
    }
});
