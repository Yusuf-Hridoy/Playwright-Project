// AI heal suggestions.
//
//   npm run ai:heal
//
// A heal means a page object's first locator found nothing and a backup had to
// step in. That is a warning, not a fix: the real locator is out of date. This
// script asks the AI for a better one, then checks the answer on the real page
// before anybody sees it.
//
// For each healed element:
//   1. Open the page again in Chromium: the same path, the same drift, the same
//      saved login, against BASE_URL.
//   2. Find the element with the way that worked, and collect facts about it.
//   3. Send the AI those facts, the ways the page object has, and what failed.
//   4. The AI answers with a description of a locator, never with code.
//   5. ai/check-shape.mjs checks the answer.
//   6. This script builds the Playwright locator from the checked fields, and
//      only from the four strategies it knows.
//   7. It verifies the built locator finds exactly one element, and the same
//      one. Only then is the suggestion marked verified.
//
// It never edits a page object. A person applies the suggestions. It never
// fails a run: with no key, no heal report or no heals, it writes one note and
// exits successfully.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { AiUnavailableError, askForJson, chosenProvider, readPrompt, REPO } from './ai-client.mjs';
import { answerList, checkHealSuggestion } from './check-shape.mjs';
import { redact } from './redact.mjs';

const HEAL_REPORT = path.join(REPO, 'heal-report', 'heal-report.json');
const REPORT_DIR = path.join(REPO, 'ai-report');
const MARKDOWN_FILE = path.join(REPORT_DIR, 'heal-suggestions.md');
const JSON_FILE = path.join(REPORT_DIR, 'heal-suggestions.json');

/** The heading the job summary gets. */
const HEADING = '## AI heal suggestions (written by AI, verified on the page)';

/** At most this many elements in one run, with no element twice. */
const MAX_ELEMENTS = 15;

/** How many go to the AI in one request, to stay inside the free limits. */
const BATCH_SIZE = 10;

/** How long to wait for an element to turn up on a page that is still loading. */
const FIND_TIMEOUT_MS = 15_000;

/**
 * The live app, and the seed that makes its prices repeat. The seed is the same
 * one as config/test-settings.ts; this script is plain Node and cannot import
 * the TypeScript, so SEED overrides it for a run that needs a different one.
 */
const BASE_URL = (process.env.BASE_URL ?? 'https://practiceapp-six.vercel.app').replace(/\/+$/, '');
const SEED = process.env.SEED ?? '42';

/** Matches config/test-settings.ts, so the money text reads the same. */
const LOCALE = 'en-US';
const TIME_ZONE = 'Asia/Dhaka';

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}

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

/** Writes one short note everywhere a person might look, and exits happy. */
function stop(note) {
  const markdown = [HEADING, '', note, ''].join('\n');
  write(MARKDOWN_FILE, markdown);
  write(JSON_FILE, `${JSON.stringify({ note, suggestions: [] }, null, 2)}\n`);
  process.stdout.write(`${note}\n`);
  appendToSummary(markdown);
  process.exit(0);
}

/** The healed elements worth asking about: no repeats, newest first, capped. */
function elementsToAsk(heals) {
  const seen = new Set();
  const chosen = [];

  for (const heal of heals) {
    const key = `${heal.where}|${heal.element}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // Without Playwright's own selector for the way that worked there is no way
    // to find the element again, and guessing is exactly what this script is
    // built to avoid.
    if (typeof heal.usedSelector !== 'string' || heal.usedSelector === '') {
      chosen.push({
        ...heal,
        id: `e${chosen.length + 1}`,
        skipped: 'the heal report has no selector for the way that worked',
      });
    } else {
      chosen.push({ ...heal, id: `e${chosen.length + 1}`, skipped: '' });
    }
    if (chosen.length === MAX_ELEMENTS) break;
  }

  return chosen;
}

/** The link to open: the same page, with the same drift and the usual seed. */
function urlFor(heal) {
  // Which page it was (symbol=KRYL, id=h3) comes from the heal report. How it
  // was switched is added here, so a suggestion is checked under the same
  // renaming the test ran against.
  const query = new URLSearchParams(typeof heal.query === 'string' ? heal.query : '');
  if (typeof heal.drift === 'string' && heal.drift !== '') query.set('drift', heal.drift);
  query.set('seed', SEED);
  return `${BASE_URL}${heal.path === '' ? '/' : heal.path}?${query.toString()}`;
}

/** The saved login a test used, if the file is still there. */
function storageStateFor(login) {
  if (typeof login !== 'string' || login === '') return undefined;
  const file = path.join(REPO, '.auth', `${login}.json`);
  return fs.existsSync(file) ? file : undefined;
}

/** What the element actually is on the page right now. */
async function factsOf(locator) {
  const snapshot = await locator.ariaSnapshot().catch(() => '');
  const firstLine = snapshot.split('\n')[0] ?? '';
  const parsed = /^\s*-\s+([a-zA-Z]+)(?:\s+"([^"]*)")?/.exec(firstLine);

  const label = await locator
    .evaluate((element) => {
      const aria = element.getAttribute('aria-label');
      if (aria !== null && aria.trim() !== '') return aria.trim();
      const by = element.getAttribute('aria-labelledby');
      if (by !== null) {
        const words = by
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
          .join(' ')
          .trim();
        if (words !== '') return words;
      }
      const labels = element.labels;
      if (labels !== undefined && labels !== null && labels.length > 0) {
        return labels[0].textContent?.trim() ?? '';
      }
      const wrapping = element.closest('label');
      return wrapping === null ? '' : (wrapping.textContent?.trim() ?? '');
    })
    .catch(() => '');

  const text = await locator.innerText().catch(() => '');
  const testId = await locator.getAttribute('data-testid').catch(() => null);

  return {
    role: parsed?.[1] ?? '',
    accessibleName: parsed?.[2] ?? '',
    label: redact(label).slice(0, 200),
    testId: redact(testId ?? ''),
    text: redact(text).replace(/\s+/g, ' ').trim().slice(0, 200),
    ariaSnapshot: redact(snapshot).slice(0, 400),
  };
}

/** Opens the page, finds the element, and reads its facts. */
async function lookAtElement(browser, contexts, heal) {
  const login = typeof heal.login === 'string' ? heal.login : '';
  let context = contexts.get(login);
  if (context === undefined) {
    const storageState = storageStateFor(login);
    context = await browser.newContext({
      baseURL: BASE_URL,
      locale: LOCALE,
      timezoneId: TIME_ZONE,
      ...(storageState === undefined ? {} : { storageState }),
    });
    contexts.set(login, context);
  }

  const page = await context.newPage();
  try {
    await page.goto(urlFor(heal), { waitUntil: 'domcontentloaded' });
    const found = page.locator(heal.usedSelector).first();
    await found.waitFor({ state: 'attached', timeout: FIND_TIMEOUT_MS });
    const facts = await factsOf(found);
    return { page, found, facts, problem: '' };
  } catch (error) {
    await page.close();
    return { page: null, found: null, facts: null, problem: redact(error.message).slice(0, 200) };
  }
}

const ESCAPE = /[.*+?^${}()|[\]\\]/g;

/** A namePattern is a plain substring, matched without case. Never a regex. */
function asPattern(text) {
  return new RegExp(text.replace(ESCAPE, '\\$&'), 'i');
}

/**
 * Builds the Playwright locator from the checked fields, and from nothing else.
 * This is the only place a suggestion turns into something that touches the
 * page, and it knows exactly four strategies.
 */
function buildLocator(page, suggestion) {
  const named =
    suggestion.name !== undefined
      ? suggestion.name
      : suggestion.namePattern !== undefined
        ? asPattern(suggestion.namePattern)
        : undefined;

  if (suggestion.strategy === 'role') {
    return page.getByRole(suggestion.role, named === undefined ? {} : { name: named });
  }
  if (suggestion.strategy === 'label') {
    return page.getByLabel(named);
  }
  if (suggestion.strategy === 'testid') {
    return page.getByTestId(suggestion.testId);
  }
  // text
  return page.getByText(suggestion.text !== undefined ? suggestion.text : named);
}

/** The suggestion in plain words, written by this script and not by the AI. */
function describe(suggestion) {
  const name =
    suggestion.name !== undefined
      ? `named "${suggestion.name}"`
      : suggestion.namePattern !== undefined
        ? `whose name holds "${suggestion.namePattern}", any case`
        : '';

  if (suggestion.strategy === 'role') return `role ${suggestion.role} ${name}`.trim();
  if (suggestion.strategy === 'label') return `label ${name.replace(/^named /, '')}`.trim();
  if (suggestion.strategy === 'testid') return `test id ${suggestion.testId}`;
  return suggestion.text !== undefined ? `text "${suggestion.text}"` : `text ${name}`;
}

/** The line a person can paste into the page object, also written by this script. */
function codeLine(suggestion) {
  const quoted = (value) => `'${String(value).replace(/'/g, "\\'")}'`;
  const name =
    suggestion.name !== undefined
      ? `name: ${quoted(suggestion.name)}`
      : suggestion.namePattern !== undefined
        ? `name: /${suggestion.namePattern.replace(ESCAPE, '\\$&')}/i`
        : '';

  if (suggestion.strategy === 'role') {
    return name === ''
      ? `page.getByRole(${quoted(suggestion.role)})`
      : `page.getByRole(${quoted(suggestion.role)}, { ${name} })`;
  }
  if (suggestion.strategy === 'label') {
    return `page.getByLabel(${name.replace('name: ', '')})`;
  }
  if (suggestion.strategy === 'testid') {
    return `page.getByTestId(${quoted(suggestion.testId)})`;
  }
  return suggestion.text !== undefined
    ? `page.getByText(${quoted(suggestion.text)})`
    : `page.getByText(${name.replace('name: ', '')})`;
}

/** Checks the built locator finds exactly one element, and the very same one. */
async function verify(page, found, suggestion) {
  let built;
  try {
    built = buildLocator(page, suggestion);
  } catch (error) {
    return { verified: false, note: `the locator could not be built: ${error.message}` };
  }

  let count;
  try {
    count = await built.count();
  } catch (error) {
    return { verified: false, note: `the locator could not be used: ${error.message}` };
  }

  if (count !== 1) return { verified: false, note: `found ${count}` };

  try {
    const handle = await found.elementHandle();
    const same = await built.evaluate((element, other) => element === other, handle);
    await handle?.dispose();
    if (!same) return { verified: false, note: 'found one element, but a different one' };
  } catch (error) {
    return { verified: false, note: `the two could not be compared: ${error.message}` };
  }

  return { verified: true, note: '' };
}

function batch(items, size) {
  const batches = [];
  for (let at = 0; at < items.length; at += size) batches.push(items.slice(at, at + size));
  return batches;
}

/** Asks about one batch. A batch that fails never stops the others. */
async function askBatch(instructions, elements) {
  const answers = new Map();
  let note = '';

  try {
    const parsed = await askForJson({ instructions, input: { elements } });
    const list = answerList(parsed);
    if (list === null) {
      note = 'The answer was not a list of results.';
    } else {
      for (const answer of list) {
        const id = typeof answer?.id === 'string' ? answer.id : '';
        // The id is ours, not a field of the suggestion, so it comes off
        // before the shape is checked.
        const rest = { ...(answer ?? {}) };
        delete rest.id;
        const checked = checkHealSuggestion(rest);
        if (id !== '' && checked.ok) answers.set(id, checked.value);
        else if (id !== '') answers.set(id, { problems: checked.problems });
      }
    }
  } catch (error) {
    note = error instanceof AiUnavailableError ? error.message : `Unexpected: ${error.message}`;
  }

  return { answers, note };
}

/** One line, no line breaks: a table cell that holds an error must stay a cell. */
function oneLine(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\|/g, '/')
    .trim();
}

function markdownFor(rows, notes) {
  const lines = [HEADING, ''];
  lines.push(
    'Each line is one locator a test had to heal around. The AI described a new',
    'way of finding it; this script built that locator itself and checked it on',
    'the page. Nothing has been changed. A verified line is ready to paste into',
    'the page object as its new first way.',
    '',
    '| Page object | Element | Page | Old first way | Suggested first way | Checked | Why |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  );

  for (const row of rows) {
    if (row.suggestion === null) {
      lines.push(
        `| ${row.where} | ${row.element} | ${row.path || '-'} | ${row.failed} | ` +
          `**no usable suggestion** | - | ${oneLine(row.problem)} |`,
      );
      continue;
    }
    const checked = row.verified ? 'verified' : `not verified (${oneLine(row.note)})`;
    lines.push(
      `| ${row.where} | ${row.element} | ${row.path || '-'} | ${row.failed} | ` +
        `${row.suggested} | ${checked} | ${oneLine(row.suggestion.reason)} |`,
    );
  }

  lines.push('');
  const verified = rows.filter((row) => row.verified);
  if (verified.length > 0) {
    lines.push('### The verified ones, as lines to paste', '');
    for (const row of verified) {
      lines.push(`- **${row.where} ${row.element}** — \`${row.code}\``);
    }
    lines.push('');
  }
  for (const note of notes) lines.push(`- A batch could not be answered: ${oneLine(note)}`);
  if (notes.length > 0) lines.push('');
  return lines.join('\n');
}

async function main() {
  if (!fs.existsSync(HEAL_REPORT)) {
    stop('No locators needed healing.');
  }

  let report;
  try {
    report = JSON.parse(fs.readFileSync(HEAL_REPORT, 'utf8'));
  } catch (error) {
    stop(`The heal report could not be read as JSON: ${error.message}`);
  }

  const heals = Array.isArray(report.heals) ? report.heals : [];
  if (heals.length === 0) {
    stop('No locators needed healing.');
  }

  const chosen = chosenProvider();
  if (!chosen.ready) {
    stop(`AI heal suggestions skipped: ${chosen.reason}`);
  }

  const elements = elementsToAsk(heals);
  const instructions = readPrompt('heal.md');

  const browser = await chromium.launch();
  const contexts = new Map();
  const looked = [];

  try {
    for (const heal of elements) {
      if (heal.skipped !== '') {
        looked.push({ heal, page: null, found: null, facts: null, problem: heal.skipped });
        continue;
      }
      const seen = await lookAtElement(browser, contexts, heal);
      looked.push({ heal, ...seen });
    }

    const askable = looked.filter((one) => one.facts !== null);
    const answers = new Map();
    const notes = [];

    for (const group of batch(askable, BATCH_SIZE)) {
      const asked = group.map(({ heal, facts }) => ({
        id: heal.id,
        pageObject: heal.where,
        element: heal.element,
        page: heal.path,
        drift: heal.drift,
        failed: heal.failed,
        used: heal.used,
        facts,
      }));
      const { answers: got, note } = await askBatch(instructions, asked);
      for (const [id, answer] of got) answers.set(id, answer);
      if (note !== '') notes.push(note);
    }

    const rows = [];
    for (const one of looked) {
      const answer = answers.get(one.heal.id);

      if (one.facts === null) {
        rows.push({
          ...one.heal,
          suggestion: null,
          problem: one.problem || 'the page could not be opened',
        });
        continue;
      }
      if (answer === undefined) {
        rows.push({ ...one.heal, suggestion: null, problem: 'the AI gave no answer for this one' });
        continue;
      }
      if (answer.strategy === undefined) {
        rows.push({
          ...one.heal,
          suggestion: null,
          problem: `the answer was rejected: ${answer.problems.join(' ')}`,
        });
        continue;
      }

      const { verified, note } = await verify(one.page, one.found, answer);
      rows.push({
        ...one.heal,
        suggestion: answer,
        suggested: describe(answer),
        code: codeLine(answer),
        verified,
        note,
        problem: '',
      });
    }

    for (const one of looked) if (one.page !== null) await one.page.close();

    const markdown = markdownFor(rows, notes);
    write(MARKDOWN_FILE, markdown);
    write(
      JSON_FILE,
      `${JSON.stringify(
        {
          provider: chosen.provider,
          model: chosen.model,
          baseUrl: BASE_URL,
          notes,
          suggestions: rows,
        },
        null,
        2,
      )}\n`,
    );

    const verifiedCount = rows.filter((row) => row.verified).length;
    process.stdout.write(
      `AI heal suggestions: ${verifiedCount} of ${rows.length} verified on the page. ` +
        `See ai-report/heal-suggestions.md.\n`,
    );
    appendToSummary(markdown);
  } finally {
    for (const context of contexts.values()) await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  // An AI step never fails a run. Whatever went wrong, it is a note.
  stop(`AI heal suggestions skipped: something went wrong: ${error.message}`);
});
