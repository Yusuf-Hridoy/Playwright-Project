const env = require ('../utils/Testoption');
exports.Homepage =
class Homepage{

    constructor(page){
        this.page = page;
        this.menuButton = page.locator("#react-burger-menu-btn")
        this.logoutLink = page.locator("#logout_sidebar_link")
        this.shoppingCart = page.locator(".shopping_cart_link")
        this.addToCartbackpack = page.locator("button[data-test='add-to-cart-sauce-labs-backpack']")

        // filter locator
        this.sortingDropdown = page.locator("[data-test='product-sort-container']")
        
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

    async Sorting(){
        await this.sortingDropdown.click();
        await this.sortingDropdown.selectOption('Price (low to high)');
        // i want to print the first product price after sorting to verify that the sorting is working correctly
        const firstProductPrice = await this.page.locator(".inventory_item_price").first().textContent();
        console.log("First product price after sorting: " + firstProductPrice);


    }

}
