// Turns Playwright's JSON report into the one line GitHub shows next to the
// app's commit, like "52 passed" or "3 failed, 49 passed".
//
//   node summarise-results.js results.json
//
// It prints GitHub Actions step outputs on stdout. A missing or unreadable
// report is not a crash: the run still has to be able to write its status.

const fs = require('node:fs');

const file = process.argv[2] || 'results.json';

function readStats() {
  try {
    const report = JSON.parse(fs.readFileSync(file, 'utf8'));
    const stats = report.stats || {};
    return {
      passed: Number(stats.expected) || 0,
      failed: Number(stats.unexpected) || 0,
      flaky: Number(stats.flaky) || 0,
      skipped: Number(stats.skipped) || 0,
      read: true,
    };
  } catch {
    return { passed: 0, failed: 0, flaky: 0, skipped: 0, read: false };
  }
}

function describe(stats) {
  if (!stats.read) return 'The tests did not produce a report.';
  const parts = [];
  if (stats.failed > 0) parts.push(`${stats.failed} failed`);
  parts.push(`${stats.passed} passed`);
  if (stats.flaky > 0) parts.push(`${stats.flaky} flaky`);
  if (stats.skipped > 0) parts.push(`${stats.skipped} skipped`);
  return parts.join(', ');
}

const stats = readStats();
const lines = [
  `passed=${stats.passed}`,
  `failed=${stats.failed}`,
  `flaky=${stats.flaky}`,
  `skipped=${stats.skipped}`,
  `description=${describe(stats)}`,
];
process.stdout.write(`${lines.join('\n')}\n`);
