/**
 * Network interception and mocking helpers for Playwright tests.
 */

/**
 * Mock a specific API endpoint with a custom JSON response.
 */
async function mockAPIResponse(page, urlPattern, responseBody, status = 200) {
    await page.route(urlPattern, async (route) => {
        await route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(responseBody),
        });
    });
}

/**
 * Simulate a slow network response for matching requests.
 */
async function slowDownRequests(page, urlPattern, delayMs = 2000) {
    await page.route(urlPattern, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        await route.continue();
    });
}

/**
 * Simulate an HTTP error for matching requests.
 */
async function simulateError(page, urlPattern, status = 500) {
    await page.route(urlPattern, async (route) => {
        await route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify({ error: `Simulated ${status} error` }),
        });
    });
}

/**
 * Intercept and validate request payloads sent by the application.
 * Returns a promise that resolves with the request payload.
 */
function captureRequestPayload(page, urlPattern) {
    return new Promise((resolve) => {
        page.route(urlPattern, async (route, request) => {
            const postData = request.postData();
            resolve(postData ? JSON.parse(postData) : null);
            await route.continue();
        });
    });
}

module.exports = {
    mockAPIResponse,
    slowDownRequests,
    simulateError,
    captureRequestPayload,
};
