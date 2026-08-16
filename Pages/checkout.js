const { BasePage } = require('./BasePage');

exports.Checkout = class Checkout extends BasePage {
    constructor(page) {
        super(page);
        this.firstNameInput = page.locator("input[data-test='firstName']");
        this.lastNameInput = page.locator("input[data-test='lastName']");
        this.postalCodeInput = page.locator("input[data-test='postalCode']");
        this.continueButton = page.locator("input[data-test='continue']");
        this.cancelButton = page.locator("[data-test='cancel']");
        this.errorMessage = page.locator("h3[data-test='error']");
    }

    async fillCheckoutInformation(firstName, lastName, postalCode) {
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.postalCodeInput.fill(postalCode);
        await this.continueButton.click();
    }

    async clickCancel() {
        await this.cancelButton.click();
    }

    async getErrorMessage() {
        if (await this.errorMessage.isVisible()) {
            return await this.getText(this.errorMessage);
        }
        return null;
    }
};
