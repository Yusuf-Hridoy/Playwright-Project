// The heal report.
//
// Every time a page object has to fall back on a backup locator, the healing
// helper leaves a note on the test (utils/healing-locator.ts). This reporter
// gathers those notes and writes them down, because a heal that nobody reads
// is a locator nobody ever fixes.
//
//   heal-report/heal-report.md    for a person
//   heal-report/heal-report.json  for a tool
//
// A heal in the drift project is the point of the exercise. A heal anywhere
// else means the real app has changed under the suite, and that is printed as
// a warning at the top of the report.
//
// The reporter keeps quiet when nothing healed, so a plain `npm test` reads
// exactly as it did before.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { appendToSummary } from './github-summary';

export const HEAL_ANNOTATION = 'healed';
export const POPUP_ANNOTATION = 'popup-closed';

/** The project heals are expected in. A heal in any other is a warning. */
export const DRIFT_PROJECT = 'drift';

export const REPORT_DIR = 'heal-report';
export const MARKDOWN_FILE = join(REPORT_DIR, 'heal-report.md');
export const JSON_FILE = join(REPORT_DIR, 'heal-report.json');

/** What utils/healing-locator.ts writes into the annotation, as JSON. */
interface HealEvent {
  readonly where: string;
  readonly element: string;
  readonly failed: string;
  readonly used: string;
  /** The page it happened on, the path only: "/wallet". Never the host. */
  readonly path: string;
  /** The query values that say which page it was, like "symbol=KRYL". */
  readonly query: string;
  /** The drift switches that test ran with, like "text,ids". "" is none. */
  readonly drift: string;
  /** The saved login it used, like "trader". "" when the test logged in itself. */
  readonly login: string;
  /** Playwright's own selector for the way that failed. */
  readonly failedSelector: string;
  /**
   * Playwright's own selector for the way that worked. ai/suggest-heals.mjs
   * hands it back to page.locator() to find the very same element again.
   */
  readonly usedSelector: string;
}

interface HealRow extends HealEvent {
  /**
   * How many tests hit this one heal. The page, the drift and the login are
   * the ones the first of those tests ran with, which is all ai/suggest-heals.mjs
   * needs to open that page again the same way.
   */
  tests: number;
  /** The projects it happened in, so a heal outside drift can be spotted. */
  projects: string[];
}

interface PopupRow {
  readonly popup: string;
  times: number;
}

function keyOf(event: HealEvent): string {
  return [event.where, event.element, event.failed, event.used].join(' | ');
}

/** Runtime notes live on the result; a version that keeps them on the test is covered too. */
function annotationsOf(
  test: TestCase,
  result: TestResult,
): readonly { type: string; description?: string }[] {
  const onResult = (result as { annotations?: { type: string; description?: string }[] })
    .annotations;
  return onResult !== undefined && onResult.length > 0 ? onResult : test.annotations;
}

export default class HealReporter implements Reporter {
  private readonly heals = new Map<string, HealRow>();
  private readonly popups = new Map<string, PopupRow>();

  onTestEnd(test: TestCase, result: TestResult): void {
    const project = test.parent.project()?.name ?? 'unknown';

    for (const note of annotationsOf(test, result)) {
      if (note.type === HEAL_ANNOTATION) this.addHeal(note.description ?? '', project);
      if (note.type === POPUP_ANNOTATION) this.addPopup(note.description ?? 'unnamed popup');
    }
  }

  private addHeal(description: string, project: string): void {
    let event: HealEvent;
    try {
      event = JSON.parse(description) as HealEvent;
    } catch {
      // A note that will not parse is still worth showing, rather than losing.
      event = {
        where: 'unknown',
        element: description,
        failed: 'unknown',
        used: 'unknown',
        path: '',
        query: '',
        drift: '',
        login: '',
        failedSelector: '',
        usedSelector: '',
      };
    }

    const key = keyOf(event);
    const row = this.heals.get(key);
    if (row === undefined) {
      this.heals.set(key, { ...event, tests: 1, projects: [project] });
      return;
    }
    row.tests += 1;
    if (!row.projects.includes(project)) row.projects.push(project);
  }

  private addPopup(name: string): void {
    const row = this.popups.get(name);
    if (row === undefined) this.popups.set(name, { popup: name, times: 1 });
    else row.times += 1;
  }

  onEnd(): void {
    if (this.heals.size === 0 && this.popups.size === 0) return;

    const heals = [...this.heals.values()];
    const popups = [...this.popups.values()];
    const outsideDrift = heals.filter((row) => row.projects.some((name) => name !== DRIFT_PROJECT));

    const markdown = this.markdown(heals, popups, outsideDrift);
    this.write(MARKDOWN_FILE, markdown);
    this.write(
      JSON_FILE,
      `${JSON.stringify({ heals, popups, healsOutsideDrift: outsideDrift }, null, 2)}\n`,
    );

    const popupTotal = popups.reduce((sum, row) => sum + row.times, 0);
    const lines = [
      `Healed locators: ${heals.length}. Popups closed: ${popupTotal}. See ${MARKDOWN_FILE}.`,
    ];
    if (outsideDrift.length > 0) lines.unshift(this.warning(outsideDrift));
    process.stdout.write(`\n${lines.join('\n')}\n`);

    appendToSummary(markdown);
  }

  private warning(outsideDrift: readonly HealRow[]): string {
    const names = outsideDrift.map((row) => `${row.where} ${row.element}`).join(', ');
    return `Healing happened in a normal run. The app may have changed: check these locators. (${names})`;
  }

  private markdown(
    heals: readonly HealRow[],
    popups: readonly PopupRow[],
    outsideDrift: readonly HealRow[],
  ): string {
    const lines: string[] = ['## Heal report', ''];

    if (outsideDrift.length > 0) {
      lines.push(`> **${this.warning(outsideDrift)}**`, '');
    }

    if (heals.length === 0) {
      lines.push('No locator had to heal in this run.', '');
    } else {
      lines.push(
        '| Page object | Element | What failed | What worked | Page | Drift | Login | Tests |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
      );
      for (const row of heals) {
        lines.push(
          `| ${row.where} | ${row.element} | ${row.failed} | ${row.used} | ` +
            `${row.path || '-'} | ${row.drift || 'none'} | ${row.login || '-'} | ${row.tests} |`,
        );
      }
      lines.push('');
    }

    const popupTotal = popups.reduce((sum, row) => sum + row.times, 0);
    lines.push(`Popups closed: ${popupTotal}`, '');
    for (const row of popups) lines.push(`- ${row.popup}: ${row.times}`);
    if (popups.length > 0) lines.push('');

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
