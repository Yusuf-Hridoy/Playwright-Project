// The accessibility pass: axe-core, the WCAG 2.1 A and AA rules, and a report
// a person can read without opening a trace.
//
// A page fails on any serious or critical problem. Smaller problems are
// reported in the failure text when there is one, but they do not fail a test
// on their own, so the suite stays about things that really stop someone.

import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { knownRulesFor, type A11yPage } from '../data/a11y-known-issues';

/** WCAG 2.1, levels A and AA. Both the 2.0 and the 2.1 tags are needed. */
export const WCAG_TAGS: readonly string[] = Object.freeze([
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
]);

/** Anything this bad fails the test. */
export const BLOCKING_IMPACTS: readonly string[] = Object.freeze(['serious', 'critical']);

export interface A11yProblem {
  /** The axe rule, like "color-contrast". */
  readonly id: string;
  readonly impact: string;
  /** Axe's own one-line description of the rule. */
  readonly help: string;
  /** Every element on the page that broke it. */
  readonly elements: readonly string[];
}

export interface A11yReport {
  readonly page: A11yPage;
  /** Serious and critical problems. An empty list is a pass. */
  readonly blocking: readonly A11yProblem[];
  /** Minor and moderate problems, for the failure text only. */
  readonly smaller: readonly A11yProblem[];
}

function toProblem(violation: {
  id: string;
  impact?: string | null;
  help: string;
  nodes: { target: unknown[] }[];
}): A11yProblem {
  return {
    id: violation.id,
    impact: violation.impact ?? 'unknown',
    help: violation.help,
    elements: violation.nodes.map((node) => node.target.map(String).join(' ')),
  };
}

/**
 * Runs axe over whatever is on screen. Rules listed in a11y-known-issues.ts
 * for this page are left out, and only for this page.
 */
export async function scanPage(page: Page, which: A11yPage): Promise<A11yReport> {
  const builder = new AxeBuilder({ page }).withTags([...WCAG_TAGS]);

  const known = knownRulesFor(which);
  if (known.length > 0) builder.disableRules(known);

  const results = await builder.analyze();
  const problems = results.violations.map(toProblem);

  return {
    page: which,
    blocking: problems.filter((problem) => BLOCKING_IMPACTS.includes(problem.impact)),
    smaller: problems.filter((problem) => !BLOCKING_IMPACTS.includes(problem.impact)),
  };
}

function listProblems(title: string, problems: readonly A11yProblem[]): string {
  if (problems.length === 0) return '';
  const lines = problems.map((problem) => {
    const elements = problem.elements.map((element) => `      - ${element}`).join('\n');
    return `  ${problem.id} (${problem.impact}): ${problem.help}\n${elements}`;
  });
  return `${title}\n${lines.join('\n')}\n`;
}

/** The text a failing accessibility test prints. Empty when the page is clean. */
export function reportFor(report: A11yReport): string {
  if (report.blocking.length === 0) return '';

  const header = `The ${report.page} page has ${report.blocking.length} serious or critical accessibility problem(s).`;
  const blocking = listProblems('Serious and critical:', report.blocking);
  const smaller = listProblems('Also found, but not failing this test:', report.smaller);

  return `${header}\n\n${blocking}${smaller}`;
}
