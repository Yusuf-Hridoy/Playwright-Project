// Checking that an AI answered in the shape it was asked for.
//
// This is the gate between "the model said something" and "a script acted on
// it". Everything an AI returns goes through here first. An answer that does
// not fit is thrown away and reported as unusable; it is never patched up,
// never guessed at and never run.
//
// Two rules hold everywhere below:
//   1. Every field must be one the shape names. An extra field is a rejection,
//      because an answer with extras is an answer to a different question.
//   2. Every value must be the type, and one of the values, the shape allows.

/** The result of a check. Problems are plain sentences a person can read. */
function ok(value) {
  return { ok: true, value, problems: [] };
}

function bad(problems) {
  return { ok: false, value: null, problems };
}

/** True for a plain object: not null, not an array, not a date. */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkString(problems, object, field, { required, oneOf, max }) {
  const value = object[field];
  if (value === undefined) {
    if (required) problems.push(`${field} is missing.`);
    return;
  }
  if (typeof value !== 'string') {
    problems.push(`${field} should be text, but it is ${typeof value}.`);
    return;
  }
  if (value.trim() === '') {
    problems.push(`${field} is empty.`);
    return;
  }
  if (oneOf !== undefined && !oneOf.includes(value)) {
    problems.push(`${field} is "${value}", which is not one of ${oneOf.join(', ')}.`);
  }
  if (max !== undefined && value.length > max) {
    problems.push(`${field} is longer than ${max} characters.`);
  }
}

// --- AI failure triage ---

export const TRIAGE_CATEGORIES = ['app-bug', 'test-bug', 'flaky', 'environment', 'unknown'];
export const CONFIDENCES = ['high', 'medium', 'low'];

/** The only fields a triage answer may have. Anything else is a rejection. */
const TRIAGE_FIELDS = ['id', 'category', 'confidence', 'reason', 'nextStep'];

/**
 * One test's triage. It must have exactly id, category, confidence, reason and
 * nextStep, and category and confidence must be from the lists above.
 */
export function checkTriage(answer) {
  if (!isPlainObject(answer)) return bad(['The answer is not an object.']);

  const problems = [];
  for (const field of Object.keys(answer)) {
    if (!TRIAGE_FIELDS.includes(field))
      problems.push(`${field} is not a field of a triage answer.`);
  }

  checkString(problems, answer, 'id', { required: true, max: 200 });
  checkString(problems, answer, 'category', { required: true, oneOf: TRIAGE_CATEGORIES });
  checkString(problems, answer, 'confidence', { required: true, oneOf: CONFIDENCES });
  checkString(problems, answer, 'reason', { required: true, max: 400 });
  checkString(problems, answer, 'nextStep', { required: true, max: 300 });

  if (problems.length > 0) return bad(problems);
  return ok({
    id: answer.id,
    category: answer.category,
    confidence: answer.confidence,
    reason: answer.reason,
    nextStep: answer.nextStep,
  });
}

// --- AI heal suggestions ---

export const HEAL_STRATEGIES = ['role', 'label', 'testid', 'text'];

/** The only fields a heal suggestion may have. */
const HEAL_FIELDS = ['strategy', 'role', 'name', 'namePattern', 'testId', 'text', 'reason'];

/**
 * One suggested locator, as a description and never as code. The script builds
 * the Playwright locator itself, from these fields only, which is why each
 * strategy has to carry what that strategy needs.
 */
export function checkHealSuggestion(answer) {
  if (!isPlainObject(answer)) return bad(['The answer is not an object.']);

  const problems = [];
  for (const field of Object.keys(answer)) {
    if (!HEAL_FIELDS.includes(field)) problems.push(`${field} is not a field of a suggestion.`);
  }

  checkString(problems, answer, 'strategy', { required: true, oneOf: HEAL_STRATEGIES });
  checkString(problems, answer, 'role', { required: false, max: 40 });
  checkString(problems, answer, 'name', { required: false, max: 200 });
  checkString(problems, answer, 'namePattern', { required: false, max: 200 });
  checkString(problems, answer, 'testId', { required: false, max: 120 });
  checkString(problems, answer, 'text', { required: false, max: 200 });
  checkString(problems, answer, 'reason', { required: true, max: 400 });

  // Each strategy needs the fields it is built from. A suggestion that names a
  // strategy and then leaves out what it needs cannot be turned into a locator.
  const named = typeof answer.name === 'string' || typeof answer.namePattern === 'string';
  if (answer.strategy === 'role') {
    if (typeof answer.role !== 'string') problems.push('A role suggestion needs a role.');
    if (!named) problems.push('A role suggestion needs a name or a namePattern.');
  }
  if (answer.strategy === 'label' && !named) {
    problems.push('A label suggestion needs a name or a namePattern.');
  }
  if (answer.strategy === 'testid' && typeof answer.testId !== 'string') {
    problems.push('A testid suggestion needs a testId.');
  }
  if (answer.strategy === 'text' && typeof answer.text !== 'string' && !named) {
    problems.push('A text suggestion needs text or a namePattern.');
  }

  if (problems.length > 0) return bad(problems);

  const checked = { strategy: answer.strategy, reason: answer.reason };
  for (const field of ['role', 'name', 'namePattern', 'testId', 'text']) {
    if (typeof answer[field] === 'string') checked[field] = answer[field];
  }
  return ok(checked);
}

/**
 * Pulls an array of answers out of whatever wrapper the model put it in. Both
 * prompts ask for `{ "results": [...] }`, and a bare array is accepted too
 * because models hand one back often enough to be worth allowing.
 */
export function answerList(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (isPlainObject(parsed) && Array.isArray(parsed.results)) return parsed.results;
  return null;
}
