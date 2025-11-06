const {test, expect} = require("@playwright/test");
const env = require ('../utils/Testoption');
import { Homepage } from "../Pages/Homepage";
import { Loginpage } from "../Pages/Loginpage";
import { Cart } from "../Pages/Cart";
import { Checkout } from "../Pages/checkout";
import { CheckoutOverview } from "../Pages/checkoutoverview";

// Remove page.close() - not needed with Playwright Test
test('Homepage check', async ({page})=>{
    const homepage = new Homepage(page);
    const login = new Loginpage(page);
    const cart = new Cart(page);
    const checkout = new Checkout(page);
    const checkoutOverview = new CheckoutOverview(page);

    await login.gotoLoginPage(env.base_url)
    await login.LoginT1('standard_user' , 'secret_sauce')
    await expect(page).toHaveTitle('Swag Labs')
    await homepage.ClickMenuButton();
    await homepage.AddToCartBackpack();
    await homepage.ClickShoppingCart();
    await cart.ClickCheckoutButton();
    await checkout.FillCheckoutInformation('John', 'Doe', '12345');
    await checkoutOverview.ClickFinishButton();

   
})


