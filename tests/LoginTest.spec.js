const {test, expect} = require("@playwright/test");
const env = require ('../utils/TestOption');
import { Loginpage } from "../Pages/Loginpage";

test('test1', async ({page})=>{

    const login = new Loginpage(page)
  
    await login.gotoLoginPage(env.base_url)

    await login.LoginT1('standard_user' , 'secret_sauce')
    await expect(page).toHaveTitle('Swag Labs')
    await page.close()
})

test('test2', async ({page})=>{

    const login = new Loginpage(page)

    await login.gotoLoginPage(env.base_url)

    await login.LoginT1('standard_user' , 'wrong_password')
    const errorMessage = await login.getErrorMessage();
    expect(errorMessage).toBe('Epic sadface: Username and password do not match any user in this service')
    await page.close()
})
