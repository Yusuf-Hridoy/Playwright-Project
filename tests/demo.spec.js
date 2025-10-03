const {test, expect} = require("@playwright/test");
const env = require ('../utils/TestOption');
import { Loginpage } from "../Pages/Loginpage";

// Remove page.close() - not needed with Playwright Test
test('direct login', async ({page})=>{
    const login = new Loginpage(page)
    await login.gotoLoginPage(env.base_url)
    await login.LoginT1('standard_user' , 'secret_sauce')
    await expect(page).toHaveTitle('Swag Labs')
})