// Fails when a test is missing the tags this repo asks every test to carry.
//
// Two rules:
//   1. Exactly one priority: @p1, @p2 or @p3.
//   2. At least one requirement ID, and every ID it uses is in
//      docs/requirements.md.
//
// setup/save-logins.setup.ts is the one exception. It carries every tag there
// is so that it survives any --grep, and it protects no requirement of its own.

import { isLoginSetup, listTests, readRequirements } from './read-tests-and-requirements.mjs';

const PRIORITIES = ['@p1', '@p2', '@p3'];

const known = new Set(readRequirements().map((requirement) => requirement.id));
const tests = listTests();

const problems = [];

for (const test of tests) {
  if (isLoginSetup(test.file)) continue;

  const priorities = test.tags.filter((tag) => PRIORITIES.includes(tag));
  const requirements = test.tags.filter((tag) => tag.startsWith('@REQ-'));
  const unknown = requirements.filter((tag) => !known.has(tag.slice(1)));

  const where = `${test.file}:${test.line}  ${test.name}`;

  if (priorities.length === 0) {
    problems.push(`${where}\n    no priority tag. Add one of ${PRIORITIES.join(', ')}.`);
  } else if (priorities.length > 1) {
    problems.push(`${where}\n    ${priorities.join(' and ')}. A test gets exactly one priority.`);
  }

  if (requirements.length === 0) {
    problems.push(`${where}\n    no requirement tag. Add the ID it covers, like @REQ-TRADE-01.`);
  }

  for (const tag of unknown) {
    problems.push(`${where}\n    ${tag} is not in docs/requirements.md.`);
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} tagging problem${problems.length === 1 ? '' : 's'}:\n`);
  console.error(problems.join('\n\n'));
  console.error('\nCONTRIBUTING.md explains both rules.');
  process.exit(1);
}

console.log(`All ${tests.length} tests carry one priority and a known requirement ID.`);
