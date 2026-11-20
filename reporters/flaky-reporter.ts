// The flaky list.
//
// A test that failed and then passed on a retry is the most expensive kind of
// test to ignore: the run is green, so nobody looks, and the next team to see
// it red assumes the app is fine. This reporter writes those tests down.
//
//   flaky-report/flaky-report.md
//
// It keeps quiet off the build machine when nothing was flaky, so a plain
// `npm test` reads exactly as it did before.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { appendToSummary, onCI } from './github-summary';

export const REPORT_DIR = 'flaky-report';
export const MARKDOWN_FILE = join(REPORT_DIR, 'flaky-report.md');

export const NONE_FOUND = 'No flaky tests in this run.';

interface FlakyRow {
  readonly title: string;
  readonly file: string;
  readonly project: string;
  /** How many goes it took, the passing one included. */
  readonly tries: number;
}

export default class FlakyReporter implements Reporter {
  private readonly rows: FlakyRow[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    // Playwright calls a test flaky when it failed at least once and then
    // passed. onTestEnd runs once per go, so only the last one is counted.
    if (test.outcome() !== 'flaky') return;
    if (result.retry !== test.results.length - 1) return;

    this.rows.push({
      title: test.titlePath().slice(3).join(' › '),
      file: test.location.file.split(/[\\/]/).slice(-3).join('/'),
      project: test.parent.project()?.name ?? 'unknown',
      tries: test.results.length,
    });
  }

  onEnd(): void {
    if (this.rows.length === 0) {
      if (onCI()) appendToSummary(`## Flaky tests\n\n${NONE_FOUND}\n`);
      return;
    }

    const markdown = this.markdown();
    this.write(MARKDOWN_FILE, markdown);

    process.stdout.write(
      `\nFlaky tests: ${this.rows.length}. They passed on a retry, so the run is green. See ${MARKDOWN_FILE}.\n`,
    );
    appendToSummary(markdown);
  }

  private markdown(): string {
    const lines = [
      '## Flaky tests',
      '',
      'These failed at least once and then passed on a retry.',
      '',
      '| Test | File | Project | Tries |',
      '| --- | --- | --- | --- |',
    ];
    for (const row of this.rows) {
      lines.push(`| ${row.title} | ${row.file} | ${row.project} | ${row.tries} |`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private write(path: string, text: string): void {
    try {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, text, 'utf8');
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      process.stdout.write(`Could not write ${path}: ${reason}\n`);
    }
  }
}
