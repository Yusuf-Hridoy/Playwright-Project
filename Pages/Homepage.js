exports.Homepage = class Homepage {
    constructor(page) {
        this.page = page;
        this.menuButton = page.locator("#react-burger-menu-btn");
        this.logoutLink = page.locator("#logout_sidebar_link");
        this.shoppingCart = page.locator(".shopping_cart_link");
        this.addToCartBackpackButton = page.locator("button[data-test='add-to-cart-sauce-labs-backpack']");
        this.sortingDropdown = page.locator("[data-test='product-sort-container']");
        this.cartBadge = page.locator(".shopping_cart_badge");
        this.productPrices = page.locator(".inventory_item_price");
        this.productNames = page.locator(".inventory_item_name");
    }

    async clickMenuButton() {
        await this.menuButton.click();
    }

    async clickLogoutLink() {
        await this.logoutLink.click();
    }

    async clickShoppingCart() {
        await this.shoppingCart.click();
    }

    async addToCartBackpack() {
        await this.addToCartBackpackButton.click();
    }

    async sortBy(optionValue) {
        await this.sortingDropdown.selectOption(optionValue);
    }

    async getProductPrices() {
        return await this.productPrices.allTextContents();
    }

    async getProductNames() {
        return await this.productNames.allTextContents();
    }
};
