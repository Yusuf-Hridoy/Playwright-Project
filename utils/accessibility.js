/**
 * Accessibility helper built on @axe-core/playwright (imple.md 5.2).
 *
 * Runs an axe WCAG 2.0/2.1 (A & AA) scan against the current page and:
 *  - throws (fails the test) when CRITICAL violations are found
 *  - logs serious/moderate/minor violations as console warnings so they
 *    can be triaged without blocking the suite
 */
const { AxeBuilder } = require('@axe-core/playwright');

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * @param {import('@playwright/test').Page} page
 * @param {object}  [options]
 * @param {string}  [options.context] - label used in logs/error messages (e.g. 'login page')
 * @param {string}  [options.include] - CSS selector to limit the scan to a component
 * @param {string[]} [options.tags]   - axe rule tags (defaults to WCAG 2.0/2.1 A & AA)
 * @param {string[]} [options.excludedRules] - axe rule IDs to disable for this scan.
 *   Use ONLY for known, documented app-side issues that cannot be fixed from
 *   the test suite (e.g. the demo site's unlabeled sort dropdown).
 */
async function checkAccessibility(page, { context, include, tags, excludedRules } = {}) {
    let builder = new AxeBuilder({ page }).withTags(tags || WCAG_TAGS);
    if (include) builder = builder.include(include);
    if (excludedRules && excludedRules.length > 0) {
        console.log(`[a11y] excluding rules: ${excludedRules.join(', ')}${context ? ` [${context}]` : ''}`);
        builder = builder.disableRules(excludedRules);
    }

    const results = await builder.analyze();
    const label = context ? ` [${context}]` : '';

    const critical = results.violations.filter((v) => v.impact === 'critical');
    for (const violation of results.violations.filter((v) => v.impact !== 'critical')) {
        console.log(
            `[a11y] ${violation.impact}: ${violation.id} — ${violation.help} ` +
            `(${violation.nodes.length} node(s))${label}`
        );
    }

    if (critical.length > 0) {
        const summary = critical
            .map((v) => `  • ${v.id} (${v.nodes.length} node(s)): ${v.help}\n    ${v.helpUrl}`)
            .join('\n');
        throw new Error(
            `Accessibility check failed — ${critical.length} critical violation(s)${label}:\n${summary}`
        );
    }

    return results;
}

module.exports = { checkAccessibility };
