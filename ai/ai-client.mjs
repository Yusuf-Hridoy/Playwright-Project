// One function for both providers: askForJson().
//
// There is no AI SDK anywhere in this repo. Both providers speak HTTP and JSON,
// so both are called with plain fetch. That keeps the dependency list honest
// and makes it obvious, from this one file, exactly what is sent and where.
//
// Settings come from the environment, and from .env on a laptop:
//
//   AI_PROVIDER     groq or gemini. Missing or anything else: the AI steps are
//                   skipped with a note, and they still exit successfully.
//   AI_MODEL        optional. Overrides the default model for that provider.
//   GROQ_API_KEY    the key, when the provider is groq.
//   GEMINI_API_KEY  the key, when the provider is gemini.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/**
 * The default model for each provider.
 *
 * Chosen on 2026-11-25 from each provider's own docs, on this rule: the
 * smallest, fastest model that is on the free tier and can be asked for JSON.
 * Triage reads short error messages and answers in five short fields, so a
 * large model buys nothing and runs into the free limits sooner.
 *
 *   groq    openai/gpt-oss-20b    On the free tier (Groq dropped the Llama
 *                                 models from it in August 2026). The smaller
 *                                 of the two gpt-oss models, and it supports
 *                                 JSON object mode. Free limits at the time:
 *                                 30 requests a minute, 1,000 a day.
 *   gemini  gemini-3.5-flash-lite The Flash-Lite line is Google's small, fast
 *                                 tier and is on the free tier, and
 *                                 generateContent takes
 *                                 responseMimeType: application/json.
 *
 * To change either one, edit the line below, or set AI_MODEL for a single run
 * without touching the code. Both providers retire models at short notice, so
 * if a step reports "model not found", this is the place to look first.
 */
export const DEFAULT_MODELS = Object.freeze({
  groq: 'openai/gpt-oss-20b',
  gemini: 'gemini-3.5-flash-lite',
});

/** How long one request may take before it is given up on. */
export const TIMEOUT_MS = 30_000;

/** How long to wait before the one retry. */
export const RETRY_WAIT_MS = 3_000;

/** The one error type every caller turns into a "skipped" note. */
export class AiUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

/** Loads .env, if there is one, without overwriting anything already set. */
function loadEnvFile() {
  const file = path.join(REPO, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (match === null) continue;
    const [, name, rawValue] = match;
    if (process.env[name] !== undefined) continue;
    process.env[name] = rawValue.replace(/^["']|["']$/g, '');
  }
}

loadEnvFile();

/**
 * Which provider this run will use, or why it cannot use one. Callers print
 * `reason` as their one clear note and exit successfully.
 */
export function chosenProvider() {
  const provider = (process.env.AI_PROVIDER ?? '').trim().toLowerCase();

  if (provider === '') {
    return { ready: false, reason: 'AI_PROVIDER is not set, so there is nothing to ask.' };
  }
  if (provider !== 'groq' && provider !== 'gemini') {
    return {
      ready: false,
      reason: `AI_PROVIDER is "${provider}", which is neither groq nor gemini.`,
    };
  }

  const keyName = provider === 'groq' ? 'GROQ_API_KEY' : 'GEMINI_API_KEY';
  const key = (process.env[keyName] ?? '').trim();
  if (key === '') {
    return { ready: false, reason: `AI_PROVIDER is ${provider} but ${keyName} is not set.` };
  }

  const model = (process.env.AI_MODEL ?? '').trim() || DEFAULT_MODELS[provider];
  return { ready: true, provider, model, key, keyName };
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** One HTTP call, with its own 30 second limit. */
async function send(url, options) {
  const stop = new AbortController();
  const timer = setTimeout(() => {
    stop.abort();
  }, TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: stop.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** True for the failures that are worth one more try. */
function worthRetrying(error, response) {
  if (error !== null) return true; // A network error, or the 30 seconds ran out.
  // Too many requests, and the three server-side failures.
  return response.status === 429 || response.status >= 500;
}

/** Sends once, waits, sends once more. Never more than twice. */
async function sendWithOneRetry(url, options) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let response = null;
    let error = null;
    try {
      response = await send(url, options);
    } catch (thrown) {
      error = thrown;
    }

    if (error === null && response.ok) return response;

    const last = attempt === 2;
    if (last || !worthRetrying(error, response)) {
      if (error !== null) {
        throw new AiUnavailableError(`The provider could not be reached: ${error.message}`);
      }
      const body = await response.text().catch(() => '');
      throw new AiUnavailableError(
        `The provider answered ${response.status} ${response.statusText}. ${body.slice(0, 300)}`,
      );
    }

    await sleep(RETRY_WAIT_MS);
  }

  // Not reachable: the loop either returns or throws.
  throw new AiUnavailableError('The provider could not be reached.');
}

/** Groq, through its OpenAI-shaped chat endpoint, in JSON object mode. */
async function askGroq({ model, key }, instructions, input) {
  const response = await sendWithOneRetry('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: JSON.stringify(input) },
      ],
    }),
  });

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || text.trim() === '') {
    throw new AiUnavailableError('Groq answered with no message content.');
  }
  return text;
}

/** Gemini, through generateContent, told to answer as JSON. */
async function askGemini({ model, key }, instructions, input) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await sendWithOneRetry(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instructions }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(input) }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    }),
  });

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts
        .map((part) => part?.text ?? '')
        .join('')
        .trim()
    : '';
  if (text === '') {
    const why = data?.promptFeedback?.blockReason ?? data?.candidates?.[0]?.finishReason ?? 'none';
    throw new AiUnavailableError(`Gemini answered with no text. Reason given: ${why}.`);
  }
  return text;
}

/**
 * Asks the chosen provider one question and hands back the parsed JSON.
 *
 * `instructions` is the prompt file's text, and `input` is the data, which is
 * sent as JSON. The answer is parsed here and checked for shape by the caller,
 * with ai/check-shape.mjs. Anything that goes wrong — no provider, no key, a
 * network failure, a refusal, an answer that is not JSON — comes back as one
 * AiUnavailableError, which every caller turns into a "skipped" note.
 */
export async function askForJson({ instructions, input }) {
  const chosen = chosenProvider();
  if (!chosen.ready) throw new AiUnavailableError(chosen.reason);

  const text =
    chosen.provider === 'groq'
      ? await askGroq(chosen, instructions, input)
      : await askGemini(chosen, instructions, input);

  try {
    return JSON.parse(text);
  } catch {
    throw new AiUnavailableError(
      `The provider's answer was not JSON. It began: ${text.slice(0, 200)}`,
    );
  }
}

/** Reads one of the prompt files in ai/prompts/. */
export function readPrompt(name) {
  return fs.readFileSync(path.join(REPO, 'ai', 'prompts', name), 'utf8');
}

export { REPO };
