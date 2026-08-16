exports.BasePage = class BasePage {
    constructor(page) {
        this.page = page;
    }

    async goto(url, options = {}) {
        await this.page.goto(url, { waitUntil: 'domcontentloaded', ...options });
    }

    async waitForLoad(state = 'domcontentloaded') {
        await this.page.waitForLoadState(state);
    }

    async isVisible(locator, timeout = 5000) {
        return await locator.isVisible({ timeout });
    }

    async getText(locator) {
        const text = await locator.textContent();
        return text ? text.trim() : null;
    }

    async safeClick(locator, options = {}) {
        await locator.waitFor({ state: 'visible', ...options });
        await locator.click();
    }

    async getAllTextContents(locator) {
        return await locator.allTextContents();
    }

    async hoverAndClick(locator) {
        await locator.hover();
        await locator.click();
    }
};
