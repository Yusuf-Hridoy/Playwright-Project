const env = require ('../utils/Testoption');
exports.Checkout =
class Checkout{

    constructor(page){
        this.page = page;
        this.firstNameInput = page.locator("input[data-test='firstName']");
        this.lastNameInput = page.locator("input[data-test='lastName']");
        this.postalCodeInput = page.locator("input[data-test='postalCode']");
        this.continueButton = page.locator("input[data-test='continue']");
        this.finishButton = page.locator("button[data-test='finish']");
        this.cancelButton = page.locator("button[data-test='cancel']");
       
        
    }

    async FillCheckoutInformation(firstName, lastName, postalCode){
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.postalCodeInput.fill(postalCode);
        await this.continueButton.click();
    }

    

}

    