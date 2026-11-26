// The two things the other scripts need: every test with its tags, and every
// requirement ID from docs/requirements.md. Nothing here runs a test.
//
// `playwright test --list --reporter=json` prints the JSON to stdout, and
// config/environments.ts prints one line of its own there as well, so the two
// would come out mixed. PLAYWRIGHT_JSON_OUTPUT_NAME sends the JSON to a file
// instead, which is what both scripts here read.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** One entry per test, with the file it lives in and the tags it carries. */
export function listTests() {
  const outputFile = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'tradeloom-list-')),
    'tests.json',
  );

  const result = spawnSync(
    process.execPath,
    [
      path.join(REPO, 'node_modules', '@playwright', 'test', 'cli.js'),
      'test',
      '--list',
      '--reporter=json',
    ],
    {
      cwd: REPO,
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: outputFile },
      stdio: ['ignore', 'ignore', 'inherit'],
    },
  );

  if (result.status !== 0 || !fs.existsSync(outputFile)) {
    throw new Error(
      'Playwright could not list the tests. Run `npx playwright test --list` to see why.',
    );
  }

  const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  fs.rmSync(path.dirname(outputFile), { recursive: true, force: true });

  const tests = [];
  const titles = [];

  function walk(suite) {
    if (suite.title) titles.push(suite.title);
    for (const spec of suite.specs ?? []) {
      tests.push({
        file: spec.file,
        line: spec.line,
        // The spec's own title, with the describe blocks around it, is what a
        // person recognises in a report.
        name: [...titles.slice(1), spec.title].join(' > '),
        title: spec.title,
        // Playwright drops the @ from a tag when it lists it.
        tags: (spec.tags ?? []).map((tag) => (tag.startsWith('@') ? tag : `@${tag}`)),
      });
    }
    for (const child of suite.suites ?? []) walk(child);
    if (suite.title) titles.pop();
  }

  for (const suite of report.suites ?? []) walk(suite);

  // The same test appears once per project it runs in. One row per test is
  // what both the tag check and the coverage table want.
  const byPlace = new Map();
  for (const test of tests) {
    byPlace.set(`${test.file}:${test.line}:${test.title}`, test);
  }
  return [...byPlace.values()];
}

/** The one file that is allowed no priority rules: it carries every tag already. */
export function isLoginSetup(file) {
  return file.replace(/\\/g, '/').includes('save-logins.setup.ts');
}

/**
 * The seed the Playwright test agents start from. It is scaffolding, not a
 * test of the app: it protects no requirement and carries no priority, so both
 * scripts leave it out the same way they leave out the login setup.
 */
export function isAgentSeed(file) {
  return /(^|\/)seed\.spec\.ts$/.test(file.replace(/\\/g, '/'));
}

export const REQUIREMENTS_FILE = path.join(REPO, 'docs', 'requirements.md');

/**
 * Every requirement in docs/requirements.md, in the order it is written, read
 * from the table rows: `| REQ-TRADE-01 | ... | REQ-TRADE |`.
 */
export function readRequirements() {
  const text = fs.readFileSync(REQUIREMENTS_FILE, 'utf8');
  const rows = [];

  for (const line of text.split(/\r?\n/)) {
    const match = /^\|\s*(REQ-[A-Z0-9]+-\d+)\s*\|(.+)\|([^|]*)\|\s*$/.exec(line);
    if (!match) continue;
    rows.push({
      id: match[1],
      text: match[2].trim(),
      area: match[3].trim(),
    });
  }

  if (rows.length === 0) {
    throw new Error(`No requirements found in ${REQUIREMENTS_FILE}.`);
  }
  return rows;
}

export { REPO };
