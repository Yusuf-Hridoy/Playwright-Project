// Keeps the last 30 nights of results, and draws them on one page.
//
//   node scripts/nightly-history.mjs \
//     --results nightly-results.json \
//     --previous history.json \
//     --out playwright-report
//
// --results   the json reporter's file for tonight's run (required)
// --previous  last night's history.json. Missing or unreadable is fine: the
//             history simply starts here.
// --out       where history.json and history.html are written. The nightly
//             workflow points this at the folder that goes to Pages, so the
//             history page sits beside the report.
//
// When GITHUB_STEP_SUMMARY is set, tonight's numbers and its ten slowest
// tests are written there as well.

import fs from 'node:fs';
import path from 'node:path';

const NIGHTS_KEPT = 30;
const SLOWEST_KEPT = 10;
const TIME_ZONE = 'Asia/Dhaka';
const REPORT_LINK = 'index.html';

// --- the arguments ---

function readArguments(argv) {
  const values = { results: '', previous: '', out: 'playwright-report' };
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i].replace(/^--/, '');
    if (!(name in values)) throw new Error(`Unknown option: ${argv[i]}`);
    values[name] = argv[i + 1] ?? '';
  }
  if (!values.results) throw new Error('--results is required.');
  return values;
}

// --- tonight ---

/** The date the run started, as a person in Dhaka would write it. */
function dhakaDate(startTime) {
  const when = startTime ? new Date(startTime) : new Date();
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(when);
}

/** Every test in the report, with how long it took in all of its attempts. */
function everyTest(report) {
  const found = [];
  const titles = [];

  function walk(suite) {
    if (suite.title) titles.push(suite.title);
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const ms = (test.results ?? []).reduce(
          (total, result) => total + (result.duration ?? 0),
          0,
        );
        found.push({
          name: [...titles.slice(1), spec.title].join(' > '),
          project: test.projectName ?? '',
          ms,
        });
      }
    }
    for (const child of suite.suites ?? []) walk(child);
    if (suite.title) titles.pop();
  }

  for (const suite of report.suites ?? []) walk(suite);
  return found;
}

function tonightFrom(report) {
  const stats = report.stats ?? {};
  const slowest = everyTest(report)
    .sort((a, b) => b.ms - a.ms)
    .slice(0, SLOWEST_KEPT);

  return {
    date: dhakaDate(stats.startTime),
    passed: stats.expected ?? 0,
    failed: stats.unexpected ?? 0,
    flaky: stats.flaky ?? 0,
    skipped: stats.skipped ?? 0,
    durationMs: Math.round(stats.duration ?? 0),
    slowest,
  };
}

// --- the history ---

function readPrevious(file) {
  if (!file || !fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(parsed.nights) ? parsed.nights : [];
  } catch {
    console.warn(`${file} could not be read as a history. Starting a new one.`);
    return [];
  }
}

/** Newest first, one entry per date, at most NIGHTS_KEPT of them. */
function addTonight(nights, tonight) {
  const kept = nights.filter((night) => night.date !== tonight.date);
  return [tonight, ...kept].slice(0, NIGHTS_KEPT);
}

// --- the page ---

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function duration(ms) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
}

/**
 * A plain line chart of passed, failed and flaky over the nights, oldest on
 * the left. No script and no web font: the page has to open from a file.
 */
function chartSvg(nights) {
  const oldestFirst = [...nights].reverse();
  const width = 720;
  const height = 240;
  const left = 44;
  const right = 12;
  const top = 16;
  const bottom = 28;

  const highest = Math.max(
    1,
    ...oldestFirst.map((night) => night.passed + night.failed + night.flaky),
  );

  const x = (index) =>
    oldestFirst.length === 1
      ? left
      : left + (index * (width - left - right)) / (oldestFirst.length - 1);
  const y = (value) => top + (height - top - bottom) * (1 - value / highest);

  const line = (pick, colour, label) => {
    const points = oldestFirst.map((night, index) => `${x(index)},${y(pick(night))}`).join(' ');
    const dots = oldestFirst
      .map((night, index) => `<circle cx="${x(index)}" cy="${y(pick(night))}" r="2.5" />`)
      .join('');
    return `<g class="line ${label}"><polyline points="${points}" /><g class="dots">${dots}</g></g>`;
  };

  const gridValues = [0, Math.round(highest / 2), highest];
  const grid = gridValues
    .map(
      (value) =>
        `<g class="grid"><line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}" />` +
        `<text x="${left - 8}" y="${y(value) + 4}" text-anchor="end">${value}</text></g>`,
    )
    .join('');

  const firstDate = oldestFirst[0]?.date ?? '';
  const lastDate = oldestFirst[oldestFirst.length - 1]?.date ?? '';
  const dates =
    `<text class="axis" x="${left}" y="${height - 8}">${escapeHtml(firstDate)}</text>` +
    `<text class="axis" x="${width - right}" y="${height - 8}" text-anchor="end">${escapeHtml(lastDate)}</text>`;

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Passed, failed and flaky over the last ${oldestFirst.length} nights">
  ${grid}
  ${line((night) => night.passed, 'passed', 'passed')}
  ${line((night) => night.flaky, 'flaky', 'flaky')}
  ${line((night) => night.failed, 'failed', 'failed')}
  ${dates}
</svg>`;
}

function historyHtml(nights) {
  const tonight = nights[0];

  const rows = nights
    .map(
      (night) => `      <tr>
        <td>${escapeHtml(night.date)}</td>
        <td class="num passed">${night.passed}</td>
        <td class="num failed">${night.failed}</td>
        <td class="num flaky">${night.flaky}</td>
        <td class="num">${night.skipped}</td>
        <td class="num">${duration(night.durationMs)}</td>
      </tr>`,
    )
    .join('\n');

  const slowest = (tonight?.slowest ?? [])
    .map(
      (test) => `      <tr>
        <td>${escapeHtml(test.name)}</td>
        <td class="muted">${escapeHtml(test.project)}</td>
        <td class="num">${duration(test.ms)}</td>
      </tr>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Tradeloom nightly history</title>
    <style>
      :root {
        color-scheme: light dark;
        --ink: #1b2330;
        --muted: #5b6676;
        --line: #d8dee8;
        --card: #ffffff;
        --page: #f6f8fb;
        --passed: #2f855a;
        --failed: #c0392b;
        --flaky: #b7791f;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --ink: #e7ecf3;
          --muted: #9aa6b6;
          --line: #2b3444;
          --card: #161c26;
          --page: #0f141c;
          --passed: #68d391;
          --failed: #fc8181;
          --flaky: #f6c177;
        }
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px 16px 64px;
        background: var(--page);
        color: var(--ink);
        font: 16px/1.55 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      }
      .wrap { max-width: 860px; margin: 0 auto; display: grid; gap: 24px; }
      h1 { font-size: 24px; margin: 0; }
      h2 { font-size: 18px; margin: 0 0 12px; }
      p { margin: 0; }
      .muted { color: var(--muted); }
      .card {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 20px;
      }
      .legend { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; font-size: 14px; }
      .legend span::before {
        content: '';
        display: inline-block;
        width: 10px; height: 10px;
        border-radius: 50%;
        margin-right: 6px;
      }
      .legend .passed::before { background: var(--passed); }
      .legend .failed::before { background: var(--failed); }
      .legend .flaky::before { background: var(--flaky); }
      svg { width: 100%; height: auto; display: block; }
      .grid line { stroke: var(--line); stroke-width: 1; }
      .grid text, .axis { fill: var(--muted); font-size: 11px; }
      .line polyline { fill: none; stroke-width: 2; }
      .line circle { stroke: none; }
      .line.passed polyline { stroke: var(--passed); }
      .line.passed circle { fill: var(--passed); }
      .line.failed polyline { stroke: var(--failed); }
      .line.failed circle { fill: var(--failed); }
      .line.flaky polyline { stroke: var(--flaky); }
      .line.flaky circle { fill: var(--flaky); }
      table { width: 100%; border-collapse: collapse; font-size: 15px; }
      th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); }
      th { font-weight: 600; color: var(--muted); font-size: 13px; }
      td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
      td.passed { color: var(--passed); }
      td.failed { color: var(--failed); }
      td.flaky { color: var(--flaky); }
      a { color: inherit; }
      .scroll { overflow-x: auto; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <h1>Tradeloom nightly history</h1>
        <p class="muted">The last ${nights.length} night${nights.length === 1 ? '' : 's'}, newest first. <a href="${REPORT_LINK}">Tonight's full report</a>.</p>
      </header>

      <section class="card">
        <h2>Passed, failed and flaky</h2>
        <div class="legend">
          <span class="passed">Passed</span>
          <span class="failed">Failed</span>
          <span class="flaky">Flaky</span>
        </div>
        ${chartSvg(nights)}
      </section>

      <section class="card">
        <h2>Every night</h2>
        <div class="scroll">
          <table>
            <thead>
              <tr>
                <th>Night</th>
                <th class="num">Passed</th>
                <th class="num">Failed</th>
                <th class="num">Flaky</th>
                <th class="num">Skipped</th>
                <th class="num">Took</th>
              </tr>
            </thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h2>Tonight's ten slowest tests</h2>
        <div class="scroll">
          <table>
            <thead>
              <tr>
                <th>Test</th>
                <th>Project</th>
                <th class="num">Took</th>
              </tr>
            </thead>
            <tbody>
${slowest}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </body>
</html>
`;
}

// --- the job summary ---

function jobSummary(tonight) {
  const lines = [
    `## Nightly ${tonight.date}`,
    '',
    `| Passed | Failed | Flaky | Skipped | Took |`,
    `| --- | --- | --- | --- | --- |`,
    `| ${tonight.passed} | ${tonight.failed} | ${tonight.flaky} | ${tonight.skipped} | ${duration(tonight.durationMs)} |`,
    '',
    '### The ten slowest tests',
    '',
    '| Test | Project | Took |',
    '| --- | --- | --- |',
  ];
  for (const test of tonight.slowest) {
    lines.push(`| ${test.name} | ${test.project} | ${duration(test.ms)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

// --- doing it ---

const options = readArguments(process.argv.slice(2));

const report = JSON.parse(fs.readFileSync(options.results, 'utf8'));
const tonight = tonightFrom(report);
const nights = addTonight(readPrevious(options.previous), tonight);

fs.mkdirSync(options.out, { recursive: true });
fs.writeFileSync(
  path.join(options.out, 'history.json'),
  `${JSON.stringify({ nights }, null, 2)}\n`,
  'utf8',
);
fs.writeFileSync(path.join(options.out, 'history.html'), historyHtml(nights), 'utf8');

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, jobSummary(tonight), 'utf8');
}

console.log(
  `${tonight.date}: ${tonight.passed} passed, ${tonight.failed} failed, ${tonight.flaky} flaky, ` +
    `${tonight.skipped} skipped in ${duration(tonight.durationMs)}. ` +
    `${nights.length} night${nights.length === 1 ? '' : 's'} on file.`,
);
