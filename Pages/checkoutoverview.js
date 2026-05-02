exports.CheckoutOverview = class CheckoutOverview {
    constructor(page) {
        this.page = page;
        this.finishButton = page.locator("button[data-test='finish']");
        this.cancelButton = page.locator("button[data-test='cancel']");
        this.confirmationMessage = page.locator(".complete-header");
    }

    async clickFinishButton() {
        await this.finishButton.click();
    }

    async clickCancelButton() {
        await this.cancelButton.click();
    }

    async getConfirmationMessage() {
        if (await this.confirmationMessage.isVisible()) {
            return (await this.confirmationMessage.textContent()).trim();
        }
        return null;
    }
};
