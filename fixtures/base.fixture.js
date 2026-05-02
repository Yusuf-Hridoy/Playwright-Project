const base = require('@playwright/test');
const { Loginpage } = require('../Pages/Loginpage');
const { Homepage } = require('../Pages/Homepage');
const { Cart } = require('../Pages/Cart');
const { Checkout } = require('../Pages/checkout');
const { CheckoutOverview } = require('../Pages/checkoutoverview');

exports.test = base.test.extend({
  loginPage: async ({ page }, use) => {
    await use(new Loginpage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new Homepage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new Cart(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new Checkout(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverview(page));
  },
});

exports.expect = base.expect;
