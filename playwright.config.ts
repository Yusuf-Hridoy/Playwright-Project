import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, ENVIRONMENT_NAME } from './config/environments';
import { LOCALE, TIME_ZONE } from './config/test-settings';

const IS_CI = !!process.env.CI;

// `python -m http.server` is a toy server with a very small backlog of waiting
// connections, and it starts refusing them when every worker asks at once. The
// live app has no such limit, so only the laptop copy is held back. Tests stay
// independent either way: this changes how many run at once, nothing else.
const LOCAL_SERVER_WORKERS = 2;

// Phone tests check a phone layout, so they only make sense on the phone
// project. Every other project leaves them alone.
const MOBILE_ONLY = /@mobile/;

// Firefox and WebKit are there to catch a browser difference in the main
// journeys, not to run the whole suite three times over.
const SMOKE_ONLY = /@smoke/;

export default defineConfig({
  testDir: './tests',

  // Every test sets up its own account, so nothing has to run in order.
  fullyParallel: true,

  // A stray test.only would quietly shrink the suite on CI.
  forbidOnly: IS_CI,

  // Locally a retry would hide a real flake. On CI it absorbs network blips.
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 2 : ENVIRONMENT_NAME === 'local' ? LOCAL_SERVER_WORKERS : undefined,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,

    // The money text, the clock and the test ids all have to match the app.
    locale: LOCALE,
    timezoneId: TIME_ZONE,
    testIdAttribute: 'data-testid',

    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Logs in once as each demo account and saves the session to .auth/.
    {
      name: 'setup',
      testDir: './setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      grepInvert: MOBILE_ONLY,
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      grep: SMOKE_ONLY,
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      grep: SMOKE_ONLY,
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      grep: MOBILE_ONLY,
      dependencies: ['setup'],
    },
  ],
});
