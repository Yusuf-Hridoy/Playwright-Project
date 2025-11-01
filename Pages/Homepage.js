const env = require ('../utils/Testoption');
exports.Homepage =
class Homepage{

    constructor(page){
        this.page = page;
        this.menuButton = page.locator("#react-burger-menu-btn")
        this.logoutLink = page.locator("#logout_sidebar_link")
        this.shoppingCart = page.locator(".shopping_cart_link")
        this.addToCartbackpack = page.locator("button[data-test='add-to-cart-sauce-labs-backpack']")


       
    }

    async ClickMenuButton(){
        await this.menuButton.click();
    }

    async ClickLogoutLink(){
        await this.logoutLink.click();
    }

    async ClickShoppingCart(){
        await this.shoppingCart.click();
    }
    async AddToCartBackpack(){
        await this.addToCartbackpack.click();
    }

}
