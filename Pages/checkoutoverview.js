const { BasePage } = require('./BasePage');

exports.CheckoutOverview = class CheckoutOverview extends BasePage {
    constructor(page) {
        super(page);
        this.finishButton = page.locator("button[data-test='finish']");
        this.cancelButton = page.locator("button[data-test='cancel']");
        this.confirmationMessage = page.locator(".complete-header");
        this.orderSummary = page.locator(".summary_info");
    }

    async clickFinishButton() {
        await this.finishButton.click();
    }

    async clickCancelButton() {
        await this.cancelButton.click();
    }

    async getConfirmationMessage() {
        if (await this.confirmationMessage.isVisible()) {
            return await this.getText(this.confirmationMessage);
        }
        return null;
    }
};
