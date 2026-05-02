exports.Cart = class Cart {
    constructor(page) {
        this.page = page;
        this.cartItems = page.locator(".cart_item");
        this.checkoutButton = page.locator(".checkout_button");
    }

    async getCartItems() {
        return await this.cartItems.count();
    }

    async clickCheckoutButton() {
        await this.checkoutButton.click();
    }
};
