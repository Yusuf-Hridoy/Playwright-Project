const env = require ('../utils/Testoption');
exports.Homepage =
class Homepage{

    constructor(page){
        this.page = page;
        this.menuButton = page.locator("#react-burger-menu-btn")
        this.logoutLink = page.locator("#logout_sidebar_link")

       
    }

    async ClickMenuButton(){
        await this.menuButton.click();
    }

    async ClickLogoutLink(){
        await this.logoutLink.click();
    }


}
