const {test, expect} = require("@playwright/test");
const env = require ('../utils/Testoption');
import { Homepage } from "../Pages/Homepage";
import { Loginpage } from "../Pages/Loginpage";
const testData = require('../TestData/LoginData.json');


// Remove page.close() - not needed with Playwright Test
test('Homepage check', async ({page})=>{
    const homepage = new Homepage(page);
    const login = new Loginpage(page);
    await login.gotoLoginPage(env.base_url)
    await login.LoginT1(testData.validUser.username, testData.validUser.password)
    await expect(page).toHaveTitle('Swag Labs')

    await homepage.Sorting();

    
   
})



