const { test, expect } = require("@playwright/test");
const env = require('../utils/Testoption');
import { Loginpage } from "../Pages/Loginpage";
const testData = require('../TestData/LoginData.json');

// Remove page.close() - not needed with Playwright Test
test('direct login', async ({ page }) => {
    const login = new Loginpage(page)
    await login.gotoLoginPage(env.base_url)
    await login.LoginT1(testData.validUser.username, testData.validUser.password)
    await expect(page).toHaveTitle('Swag Labs')
})

test('wrong password', async ({ page }) => {
    const login = new Loginpage(page)
    await login.gotoLoginPage(env.base_url)
    await login.LoginT1(testData.invalidPassword.username, testData.invalidPassword.password)
    const errorMessage = await login.getErrorMessage();
    expect(errorMessage).toBe(testData.invalidPassword.errorMessage)
})

test('wrong username', async ({ page }) => {
    const login = new Loginpage(page)
    await login.gotoLoginPage(env.base_url)
    await login.LoginT1(testData.invalidUsername.username, testData.invalidUsername.password)
    const errorMessage = await login.getErrorMessage();
    expect(errorMessage).toBe(testData.invalidUsername.errorMessage)
})