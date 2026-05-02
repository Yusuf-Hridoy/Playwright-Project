exports.Loginpage = class Loginpage {
    constructor(page) {
        this.page = page;
        this.username = page.locator("#user-name");
        this.password = page.locator("#password");
        this.loginButton = page.locator("#login-button");
        this.errorMessage = page.locator("h3[data-test='error']");
    }

    async goto(url) {
        await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    }

    async login(username, password) {
        await this.username.fill(username);
        await this.password.fill(password);
        await this.loginButton.click();
    }

    async getErrorMessage() {
        if (await this.errorMessage.isVisible()) {
            return (await this.errorMessage.textContent()).trim();
        }
        return null;
    }
};
