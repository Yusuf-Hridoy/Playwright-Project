const env = require ('../utils/Testoption');
exports.Cart =
class Cart{

    constructor(page){
        this.page = page;
        this.cartItems = page.locator(".cart_item");
        this.checkoutButton = page.locator(".checkout_button");
        this.continueShoppingButton = page.locator(".continue-shopping");
        this.removeButton = page.locator("button[data-test^='remove-']");
        
    }

    async GetCartItems(){
        return await this.cartItems.count();
    }

    async ClickCheckoutButton(){
        await this.checkoutButton.click();
    }

}

    