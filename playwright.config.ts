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

// The Phase 5 tests all turn one of the app's test switches on, so they can
// only mean anything in a project built for them. Each one gets its own
// project below, and the everyday projects leave all of them alone.
const BUG_HUNT_ONLY = /@bug-hunt/;
const DRIFT_ONLY = /@drift/;
const RESILIENCE_ONLY = /@resilience/;

// A quarantined test still runs, in its own project, where its result cannot
// turn the main run red. No project but that one picks it up.
const QUARANTINE_ONLY = /@quarantine/;

// tests/seed.spec.ts is the file the Playwright test agents start from, not a
// test of the app. It gets a project of its own so the agents can run it, and
// nothing else picks it up.
const SEED_ONLY = /@seed/;

// What the everyday projects leave out: the phone tests, the four Phase 5
// areas, anything parked in quarantine, and the agents' seed.
const NOT_FOR_CHROMIUM = /@mobile|@bug-hunt|@drift|@resilience|@quarantine|@seed/;

export default defineConfig({
  testDir: './tests',

  // Every test sets up its own account, so nothing has to run in order.
  fullyParallel: true,

  // A stray test.only would quietly shrink the suite on CI.
  forbidOnly: IS_CI,

  // Locally a retry would hide a real flake. On CI it absorbs network blips.
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 2 : ENVIRONMENT_NAME === 'local' ? LOCAL_SERVER_WORKERS : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    // The three Phase 5 reporters. Each one keeps quiet unless the run gave it
    // something to say, so a plain `npm test` reads exactly as it did before.
    ['./reporters/bug-hunt-reporter.ts'],
    ['./reporters/heal-reporter.ts'],
    ['./reporters/flaky-reporter.ts'],
  ],

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
      grepInvert: NOT_FOR_CHROMIUM,
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      grep: SMOKE_ONLY,
      grepInvert: QUARANTINE_ONLY,
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      grep: SMOKE_ONLY,
      grepInvert: QUARANTINE_ONLY,
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      grep: MOBILE_ONLY,
      grepInvert: QUARANTINE_ONLY,
      dependencies: ['setup'],
    },

    // Each of the app's five bugs, switched on, against the very check the
    // everyday suite makes. Every test here is marked test.fail().
    {
      name: 'bug-hunt',
      use: { ...devices['Desktop Chrome'] },
      grep: BUG_HUNT_ONLY,
      dependencies: ['setup'],
    },

    // The app pretending to be a newer version: renamed labels, new test ids,
    // a moved layout and surprise popups.
    {
      name: 'drift',
      use: { ...devices['Desktop Chrome'] },
      grep: DRIFT_ONLY,
      dependencies: ['setup'],
    },

    // A slow app and an app that drops the odd load.
    {
      name: 'resilience',
      use: { ...devices['Desktop Chrome'] },
      grep: RESILIENCE_ONLY,
      dependencies: ['setup'],
    },

    // The seed the Playwright test agents build on. It opens the Market page
    // from a saved login and checks the cash is there, which is exactly what
    // every generated test needs in place before its first step.
    {
      name: 'seed',
      use: { ...devices['Desktop Chrome'] },
      grep: SEED_ONLY,
      dependencies: ['setup'],
    },

    // Parked tests. A retry here would only hide how unsteady the test is,
    // which is the one thing this project exists to show.
    {
      name: 'quarantine',
      use: { ...devices['Desktop Chrome'] },
      grep: QUARANTINE_ONLY,
      retries: 0,
      dependencies: ['setup'],
    },
  ],
});
