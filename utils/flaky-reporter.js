/**
 * Custom Playwright reporter that tracks flaky tests
 * (tests that fail on an attempt but pass on a retry).
 *
 * - Emits a GitHub Actions warning annotation per flaky test (visible in the UI).
 * - Writes all flaky test titles to `flaky-tests.txt` for artifact upload
 *   and root-cause analysis.
 *
 * Registered in playwright.config.js.
 */
const fs = require('fs');

class FlakyReporter {
    // This reporter does not print the test run to stdio. Declaring this lets
    // Playwright add its own terminal reporter (and keeps `--list` output intact).
    printsToStdio() {
        return false;
    }

    onBegin() {
        this.flakyTests = [];
    }

    onTestEnd(test) {
        if (test.outcome() === 'flaky') {
            const title = test.titlePath().join(' > ');
            this.flakyTests.push(title);
            console.log(`::warning::Flaky test (passed on retry): ${title}`);
        }
    }

    async onEnd() {
        if (this.flakyTests.length > 0) {
            const content = [
                `# Flaky tests detected: ${this.flakyTests.length}`,
                ...this.flakyTests.map((t) => `- ${t}`),
                '',
            ].join('\n');
            fs.writeFileSync('flaky-tests.txt', content);
            console.log(`FlakyReporter: ${this.flakyTests.length} flaky test(s) logged to flaky-tests.txt`);
        }
    }
}

module.exports = FlakyReporter;
