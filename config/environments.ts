// Which copy of Tradeloom the suite runs against.
//
// Order of precedence:
//   1. BASE_URL        - any full URL wins, so a preview deploy needs no code change.
//   2. TEST_ENV        - "production" (default) or "local".
//
// A .env file is loaded when it exists, so a laptop can keep its own choice
// without changing anything that is committed.

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const ENV_FILE = path.join(__dirname, '..', '.env');
if (fs.existsSync(ENV_FILE)) {
  dotenv.config({ path: ENV_FILE, quiet: true });
}

export type EnvironmentName = 'production' | 'local';

export const ENVIRONMENTS: Readonly<Record<EnvironmentName, string>> = Object.freeze({
  // The live app on Vercel. Clean links like /market.
  production: 'https://practiceapp-six.vercel.app',
  // A laptop copy: run `python -m http.server 8000` inside ../Practice-App.
  // That server needs file names, so links become /market.html (see utils/app-paths.ts).
  local: 'http://localhost:8000',
});

export const DEFAULT_ENVIRONMENT: EnvironmentName = 'production';

function readEnvironmentName(): EnvironmentName {
  const raw = (process.env.TEST_ENV ?? '').trim().toLowerCase();
  if (raw === 'production' || raw === 'local') return raw;
  if (raw !== '') {
    throw new Error(`TEST_ENV must be "production" or "local", but it is "${process.env.TEST_ENV}".`);
  }
  return DEFAULT_ENVIRONMENT;
}

export const ENVIRONMENT_NAME: EnvironmentName = readEnvironmentName();

function readBaseUrl(): string {
  const override = (process.env.BASE_URL ?? '').trim();
  const chosen = override === '' ? ENVIRONMENTS[ENVIRONMENT_NAME] : override;
  // A trailing slash would turn /market into //market.
  return chosen.replace(/\/+$/, '');
}

export const BASE_URL: string = readBaseUrl();

// One line, printed by the main process only. Workers stay quiet.
if (process.env.TEST_WORKER_INDEX === undefined) {
  console.log(`Testing Tradeloom at ${BASE_URL}`);
}
