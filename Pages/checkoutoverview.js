const env = require ('../utils/Testoption');
exports.CheckoutOverview =
class CheckoutOverview{

    constructor(page){
        this.page = page;
        this.finishButton = page.locator("button[data-test='finish']");
        this.cancelButton = page.locator("button[data-test='cancel']");
       
       
        
    }
    async ClickFinishButton(){
        await this.finishButton.click();
    }

    async ClickCancelButton(){
        await this.cancelButton.click();
    }

}

    