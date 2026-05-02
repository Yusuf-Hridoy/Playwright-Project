const { test, expect } = require("@playwright/test");
const env = require('../utils/Testoption');
const { Loginpage } = require('../Pages/Loginpage');
const testData = require('../TestData/LoginData.json');

test('direct login', async ({ page }) => {
    const login = new Loginpage(page);
    await login.goto(env.base_url);
    await login.login(testData.validUser.username, testData.validUser.password);
    await expect(page).toHaveTitle('Swag Labs');
});
