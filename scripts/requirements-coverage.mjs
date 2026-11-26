// Builds docs/requirements-coverage.md: which tests cover which requirement.
//
// It reads the requirement IDs from docs/requirements.md and the tags from
// Playwright's own list of the tests, so the table can never drift away from
// either one. Run it with `npm run coverage:requirements` and commit the file
// it writes.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  REPO,
  isAgentSeed,
  isLoginSetup,
  listTests,
  readRequirements,
} from './read-tests-and-requirements.mjs';

const OUTPUT_FILE = path.join(REPO, 'docs', 'requirements-coverage.md');

const requirements = readRequirements();
const tests = listTests().filter((test) => !isLoginSetup(test.file) && !isAgentSeed(test.file));

/** requirement ID -> the tests tagged with it. */
const covering = new Map(requirements.map((requirement) => [requirement.id, []]));

for (const test of tests) {
  for (const tag of test.tags) {
    if (!tag.startsWith('@REQ-')) continue;
    const list = covering.get(tag.slice(1));
    if (list) list.push(test);
  }
}

const areas = [];
for (const requirement of requirements) {
  let area = areas.find((candidate) => candidate.name === requirement.area);
  if (!area) {
    area = { name: requirement.area, requirements: [] };
    areas.push(area);
  }
  area.requirements.push(requirement);
}

const covered = requirements.filter((requirement) => covering.get(requirement.id).length > 0);
const notCovered = requirements.filter((requirement) => covering.get(requirement.id).length === 0);

const lines = [];
lines.push('# Which tests cover which requirement');
lines.push('');
lines.push('<!-- Written by scripts/requirements-coverage.mjs. Do not edit by hand. -->');
lines.push('');
lines.push(
  `**${covered.length} of ${requirements.length} requirements covered**, by ${tests.length} tests.`,
);
lines.push('');
lines.push('Every requirement is in [requirements.md](requirements.md). Regenerate this page');
lines.push('with `npm run coverage:requirements`.');
lines.push('');

for (const area of areas) {
  lines.push(`## ${area.name}`);
  lines.push('');
  lines.push('| ID | Tests | Covered by |');
  lines.push('| --- | --- | --- |');
  for (const requirement of area.requirements) {
    const found = covering.get(requirement.id);
    const names =
      found.length === 0 ? '_nothing yet_' : found.map((test) => test.name).join('<br>');
    lines.push(`| ${requirement.id} | ${found.length} | ${names} |`);
  }
  lines.push('');
}

lines.push('## Not covered yet');
lines.push('');
if (notCovered.length === 0) {
  lines.push('Every requirement has at least one test.');
} else {
  lines.push('| ID | Requirement |');
  lines.push('| --- | --- |');
  for (const requirement of notCovered) {
    lines.push(`| ${requirement.id} | ${requirement.text} |`);
  }
}
lines.push('');

// The line endings the machine running this uses, so a Windows checkout does
// not show the file as changed every time the script is run.
fs.writeFileSync(OUTPUT_FILE, lines.join(os.EOL), 'utf8');

console.log(
  `${covered.length} of ${requirements.length} requirements covered. Wrote ${path.relative(REPO, OUTPUT_FILE)}.`,
);
