const { BasePage } = require('./BasePage');

exports.Loginpage = class Loginpage extends BasePage {
    constructor(page) {
        super(page);
        this.username = page.locator("#user-name");
        this.password = page.locator("#password");
        this.loginButton = page.locator("#login-button");
        this.errorMessage = page.locator("h3[data-test='error']");
    }

    async login(username, password) {
        await this.username.fill(username);
        await this.password.fill(password);
        await this.loginButton.click();
    }

    async getErrorMessage() {
        if (await this.errorMessage.isVisible()) {
            return await this.getText(this.errorMessage);
        }
        return null;
    }
};
