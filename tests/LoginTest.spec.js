const { test, expect } = require("@playwright/test");
const env = require('../utils/Testoption');
const { Loginpage } = require('../Pages/Loginpage');
const testData = require('../TestData/LoginData.json');
const percySnapshot = require('@percy/playwright');

test.describe('Login', () => {
    test('visual snapshot - login page', async ({ page }) => {
        await page.goto(env.base_url);
        await percySnapshot(page, 'Login Page');
    });

    test('valid login', async ({ page }) => {
        const login = new Loginpage(page);
        await login.goto(env.base_url);
        await login.login(testData.validUser.username, testData.validUser.password);
        await expect(page).toHaveTitle('Swag Labs');
        await percySnapshot(page, 'Homepage - Logged In');
    });

    test('wrong password', async ({ page }) => {
        const login = new Loginpage(page);
        await login.goto(env.base_url);
        await login.login(testData.invalidPassword.username, testData.invalidPassword.password);
        const errorMessage = await login.getErrorMessage();
        expect(errorMessage).toBe(testData.invalidPassword.errorMessage);
        await percySnapshot(page, 'Login - Wrong Password Error');
    });

    test('wrong username', async ({ page }) => {
        const login = new Loginpage(page);
        await login.goto(env.base_url);
        await login.login(testData.invalidUsername.username, testData.invalidUsername.password);
        const errorMessage = await login.getErrorMessage();
        expect(errorMessage).toBe(testData.invalidUsername.errorMessage);
        await percySnapshot(page, 'Login - Wrong Username Error');
    });
});
