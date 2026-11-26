// AI failure triage, for the nightly run.
//
//   npm run ai:triage -- nightly-results.json
//
// Reads the merged results file the nightly already makes, takes the tests that
// failed or were flaky, and asks the AI what kind of problem each one looks
// like. It writes ai-report/triage.md and ai-report/triage.json, and adds the
// table to the GitHub job summary.
//
// What this script will never do: run anything the AI wrote, change a file in
// the suite, message anyone, open an issue, or fail the run. Every answer is
// checked for shape by ai/check-shape.mjs first, and a test whose answer does
// not fit is shown as "AI couldn't classify this one". With no key, or with a
// provider that is down, it prints one note and exits successfully.

import fs from 'node:fs';
import path from 'node:path';
import { AiUnavailableError, askForJson, chosenProvider, readPrompt, REPO } from './ai-client.mjs';
import { answerList, checkTriage } from './check-shape.mjs';
import { lastSteps, redactError } from './redact.mjs';

const REPORT_DIR = path.join(REPO, 'ai-report');
const MARKDOWN_FILE = path.join(REPORT_DIR, 'triage.md');
const JSON_FILE = path.join(REPORT_DIR, 'triage.json');

/** The heading the job summary gets, so nobody mistakes this for a verdict. */
const HEADING = '## AI triage (written by AI, check before acting)';

/** At most this many tests go to the AI in one night. Failed ones go first. */
const MAX_TESTS = 20;

/** How many go in one request, to stay inside the free limits. */
const BATCH_SIZE = 10;

/** Writes a block of markdown to the GitHub job summary, if there is one. */
function appendToSummary(markdown) {
  const file = process.env['GITHUB_STEP_SUMMARY'];
  if (file === undefined || file === '') return;
  try {
    fs.appendFileSync(file, `${markdown}\n`, 'utf8');
  } catch (error) {
    process.stdout.write(`Could not write the job summary: ${error.message}\n`);
  }
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}

/** Writes one short note everywhere a person might look, and exits happy. */
function skip(note) {
  const markdown = [HEADING, '', `AI triage skipped: ${note}`, ''].join('\n');
  write(MARKDOWN_FILE, markdown);
  write(JSON_FILE, `${JSON.stringify({ skipped: true, note, tests: [] }, null, 2)}\n`);
  process.stdout.write(`AI triage skipped: ${note}\n`);
  appendToSummary(markdown);
  process.exit(0);
}

/** The deepest step that carries an error: the one the test actually died on. */
function failedStepOf(steps) {
  if (!Array.isArray(steps)) return '';
  for (const step of steps) {
    const deeper = failedStepOf(step.steps);
    if (deeper !== '') return deeper;
    if (step.error !== undefined && typeof step.title === 'string') return step.title;
  }
  return '';
}

/** Every step title in order, for the little bit of context the AI gets. */
function stepTitles(steps, into = []) {
  if (!Array.isArray(steps)) return into;
  for (const step of steps) {
    if (typeof step.title === 'string') into.push(step.title);
    stepTitles(step.steps, into);
  }
  return into;
}

function errorTextOf(result) {
  const first = Array.isArray(result.errors) ? result.errors[0] : undefined;
  const message = first?.message ?? result.error?.message ?? '';
  return redactError(message);
}

/** Walks the report and pulls out every test that failed or was flaky. */
function readFailures(report) {
  const failures = [];

  function walk(suite, titles) {
    const here = suite.title === undefined ? titles : [...titles, suite.title];
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const outcome =
          test.status === 'unexpected' ? 'failed' : test.status === 'flaky' ? 'flaky' : '';
        if (outcome === '') continue;

        const last = (test.results ?? []).at(-1) ?? {};
        failures.push({
          // Our own id, so the AI has something short to copy back and the
          // script can match its answer to the right test.
          id: `t${failures.length + 1}`,
          title: [...here.slice(1), spec.title].join(' > '),
          file: spec.file ?? '',
          line: spec.line ?? 0,
          project: test.projectName ?? '',
          result: outcome,
          tries: (test.results ?? []).length,
          error: errorTextOf(last),
          failedStep: failedStepOf(last.steps),
          steps: lastSteps(stepTitles(last.steps)),
          tags: (spec.tags ?? []).map((tag) => (tag.startsWith('@') ? tag : `@${tag}`)),
        });
      }
    }
    for (const child of suite.suites ?? []) walk(child, here);
  }

  for (const suite of report.suites ?? []) walk(suite, []);

  // Failed first, so that if there are more than MAX_TESTS the ones that are
  // certainly broken are the ones that get looked at.
  failures.sort((left, right) =>
    left.result === right.result ? 0 : left.result === 'failed' ? -1 : 1,
  );
  return failures.slice(0, MAX_TESTS);
}

function batch(items, size) {
  const batches = [];
  for (let at = 0; at < items.length; at += size) batches.push(items.slice(at, at + size));
  return batches;
}

/** Asks about one batch. One failed batch never stops the others. */
async function triageBatch(instructions, tests) {
  const answers = new Map();
  let note = '';

  try {
    const parsed = await askForJson({ instructions, input: { tests } });
    const list = answerList(parsed);
    if (list === null) {
      note = 'The answer was not a list of results.';
    } else {
      for (const answer of list) {
        const checked = checkTriage(answer);
        if (checked.ok) answers.set(checked.value.id, checked.value);
      }
    }
  } catch (error) {
    note = error instanceof AiUnavailableError ? error.message : `Unexpected: ${error.message}`;
  }

  return { answers, note };
}

const CATEGORY_WORDS = {
  'app-bug': 'App bug',
  'test-bug': 'Test bug',
  flaky: 'Flaky',
  environment: 'Environment',
  unknown: 'Unknown',
};

function markdownFor(rows, notes) {
  const lines = [HEADING, ''];
  lines.push(
    'Every line below was written by an AI from the error text alone. Nothing',
    'here has been acted on, and nothing here is a verdict. Read the trace',
    'before you change anything.',
    '',
    '| Test | Project | Result | What the AI thinks | How sure | Why | What to do first |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  );

  for (const row of rows) {
    const where = `${row.file}:${row.line}`;
    if (row.answer === null) {
      lines.push(
        `| ${row.title}<br>\`${where}\` | ${row.project} | ${row.result} | ` +
          `**AI couldn't classify this one** | - | - | Read the error yourself, as before. |`,
      );
      continue;
    }
    lines.push(
      `| ${row.title}<br>\`${where}\` | ${row.project} | ${row.result} | ` +
        `${CATEGORY_WORDS[row.answer.category]} | ${row.answer.confidence} | ` +
        `${row.answer.reason} | ${row.answer.nextStep} |`,
    );
  }

  lines.push('');
  for (const note of notes) lines.push(`- A batch could not be classified: ${note}`);
  if (notes.length > 0) lines.push('');
  return lines.join('\n');
}

async function main() {
  const resultsFile = process.argv[2];
  if (resultsFile === undefined || resultsFile === '') {
    skip('no results file was given. Pass one: npm run ai:triage -- <results.json>');
  }
  if (!fs.existsSync(resultsFile)) {
    skip(`there is no results file at ${resultsFile}.`);
  }

  let report;
  try {
    report = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  } catch (error) {
    skip(`the results file could not be read as JSON: ${error.message}`);
  }

  const failures = readFailures(report);
  if (failures.length === 0) {
    const markdown = [HEADING, '', 'No failures to triage tonight.', ''].join('\n');
    write(MARKDOWN_FILE, markdown);
    write(JSON_FILE, `${JSON.stringify({ skipped: false, tests: [] }, null, 2)}\n`);
    process.stdout.write('No failures to triage tonight.\n');
    appendToSummary(markdown);
    return;
  }

  const chosen = chosenProvider();
  if (!chosen.ready) skip(chosen.reason);

  const instructions = readPrompt('triage.md');
  const answers = new Map();
  const notes = [];

  for (const group of batch(failures, BATCH_SIZE)) {
    // The steps are context for the AI, not something it answers about, and
    // they are already redacted.
    const asked = group.map(
      ({ id, title, file, line, project, result, tries, error, failedStep, tags }) => ({
        id,
        title,
        file,
        line,
        project,
        result,
        tries,
        error,
        failedStep,
        tags,
      }),
    );
    const { answers: got, note } = await triageBatch(instructions, asked);
    for (const [id, answer] of got) answers.set(id, answer);
    if (note !== '') notes.push(note);
  }

  const rows = failures.map((failure) => ({
    ...failure,
    answer: answers.get(failure.id) ?? null,
  }));

  const markdown = markdownFor(rows, notes);
  write(MARKDOWN_FILE, markdown);
  write(
    JSON_FILE,
    `${JSON.stringify(
      { skipped: false, provider: chosen.provider, model: chosen.model, notes, tests: rows },
      null,
      2,
    )}\n`,
  );

  const classified = rows.filter((row) => row.answer !== null).length;
  process.stdout.write(
    `AI triage: ${classified} of ${rows.length} failures classified. See ai-report/triage.md.\n`,
  );
  appendToSummary(markdown);
}

main().catch((error) => {
  // An AI step never fails a run. Whatever went wrong, it is a note.
  skip(`something went wrong: ${error.message}`);
});
