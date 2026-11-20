// The bug hunt's score.
//
// Every test in tests/bug-hunt/ is marked test.fail(), so Playwright reads a
// failure as a success: the check noticed the bug. This reporter turns that
// round again into one line a person can read.
//
//   Bugs caught: 5 of 5
//
// A bug that slipped through is named, because the real news is not the score
// but which everyday test has stopped checking what it says it checks.
//
// The reporter keeps quiet when no @bug-hunt test ran, so a plain `npm test`
// reads exactly as it did before.

import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { appendToSummary } from './github-summary';

const BUG_HUNT_TAG = '@bug-hunt';

/** The annotation each bug-hunt test carries, naming the bug it switches on. */
const BUG_ANNOTATION = 'bug';

interface Hunt {
  readonly bug: string;
  readonly title: string;
  /** True when the check failed, which is the bug being caught. */
  readonly caught: boolean;
}

function bugNameOf(test: TestCase): string {
  const named = test.annotations.find((note) => note.type === BUG_ANNOTATION);
  return named?.description ?? test.title;
}

export default class BugHuntReporter implements Reporter {
  private readonly hunts: Hunt[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!test.tags.includes(BUG_HUNT_TAG)) return;
    if (result.status === 'skipped') return;

    // "expected" means the test ended the way test.fail() said it would: the
    // shared check failed, so the bug was caught.
    this.hunts.push({
      bug: bugNameOf(test),
      title: test.title,
      caught: test.outcome() === 'expected',
    });
  }

  onEnd(): void {
    if (this.hunts.length === 0) return;

    const missed = this.hunts.filter((hunt) => !hunt.caught);
    const caught = this.hunts.length - missed.length;
    const score = `Bugs caught: ${caught} of ${this.hunts.length}`;

    const lines = [score];
    for (const hunt of missed) {
      lines.push(`  Slipped through: bug=${hunt.bug} — "${hunt.title}" passed, so its check no longer catches it.`);
    }

    process.stdout.write(`\n${lines.join('\n')}\n`);

    const summary = [`## Bug hunt`, '', score, ''];
    if (missed.length > 0) {
      summary.push('| Bug | Test |', '| --- | --- |');
      for (const hunt of missed) summary.push(`| bug=${hunt.bug} | ${hunt.title} |`);
      summary.push('', 'A bug that slipped through means the everyday test sharing that check is not checking it.');
    }
    appendToSummary(summary.join('\n'));
  }
}
