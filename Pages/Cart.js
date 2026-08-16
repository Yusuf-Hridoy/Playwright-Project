const { BasePage } = require('./BasePage');

exports.Cart = class Cart extends BasePage {
    constructor(page) {
        super(page);
        this.cartItems = page.locator(".cart_item");
        this.checkoutButton = page.locator(".checkout_button");
        this.continueShoppingButton = page.locator("[data-test='continue-shopping']");
        this.removeButtons = page.locator("[data-test^='remove-']");
    }

    async getCartItemsCount() {
        return await this.cartItems.count();
    }

    async clickCheckoutButton() {
        await this.checkoutButton.click();
    }

    async clickContinueShopping() {
        await this.continueShoppingButton.click();
    }

    async removeItemByIndex(index) {
        await this.removeButtons.nth(index).click();
    }
};
