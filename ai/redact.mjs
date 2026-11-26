// Taking everything private out of the text before it leaves this machine.
//
// Nothing here is clever. It is a list of the shapes a secret takes, and a
// couple of limits so a giant error or a hundred steps never go out. The AI
// steps call these on every string they send, without exception.

/** What a removed secret is replaced with, so a person can see it happened. */
export const REMOVED = '[removed]';

/**
 * The shapes a key, a token or an embedded file takes. Each one is matched
 * whole and replaced, so a redacted string never has half a key left in it.
 *
 * The long base64 rule is last and deliberately broad: anything 40 characters
 * or more of base64 is far more likely to be a token than prose.
 */
const SECRETS = [
  // GitHub: fine-grained tokens, classic tokens, app and refresh tokens.
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
  // Groq.
  /\bgsk_[A-Za-z0-9]{20,}/g,
  // Google, which is the Gemini key as well.
  /\bAIza[A-Za-z0-9_-]{30,}/g,
  // OpenAI-style and Anthropic-style, in case either turns up in a log.
  /\bsk-[A-Za-z0-9_-]{20,}/g,
  // An Authorization header, however it was written.
  /\bBearer\s+[A-Za-z0-9._~+/=-]{10,}/gi,
  // A JSON Web Token.
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  // An embedded file, like the profile photo the app keeps as a data URL.
  /\bdata:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi,
  // Anything else long enough to be a token rather than a sentence.
  /\b[A-Za-z0-9+/]{40,}={0,2}\b/g,
];

/** How much of one error message is kept. */
export const ERROR_LIMIT = 1_500;

/** How many of a test's steps are kept, counting back from the last one. */
export const STEP_LIMIT = 10;

/**
 * Takes every secret out of a string. Anything that is not a string comes back
 * as an empty string, so a missing field can never be sent by accident.
 */
export function redact(text) {
  if (typeof text !== 'string' || text === '') return '';
  let safe = text;
  for (const secret of SECRETS) safe = safe.replace(secret, REMOVED);
  return safe;
}

/** Redacts an error message and cuts it to a length an AI can read. */
export function redactError(text, limit = ERROR_LIMIT) {
  const safe = redact(text);
  if (safe.length <= limit) return safe;
  return `${safe.slice(0, limit)}\n…cut after ${limit} characters.`;
}

/** The last few steps of a test, redacted. Older steps are dropped. */
export function lastSteps(steps, limit = STEP_LIMIT) {
  if (!Array.isArray(steps)) return [];
  return steps.slice(-limit).map((step) => redact(String(step)));
}

/** Redacts every string inside an object or an array, as deep as it goes. */
export function redactDeep(value) {
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) return value.map(redactDeep);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, redactDeep(inner)]),
    );
  }
  return value;
}
