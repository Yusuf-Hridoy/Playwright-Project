# AGENTS.md

Rules for an AI coding agent about to change this repository. Read this before
you write anything. Everything here is a hard rule unless it says otherwise.

## What this repo is

The Playwright + TypeScript end-to-end test suite for **Tradeloom**, a practice
stock trading app. The app is live at <https://practiceapp-six.vercel.app> and
its source lives in a sibling repository, `../Practice-App`.

This repository holds **tests only**. It never ships app code.

## Where things live

| Folder               | What lives there                                                             |
| -------------------- | ---------------------------------------------------------------------------- |
| `tests/<area>/`      | The specs, one behaviour per test, grouped by feature                        |
| `pages/`             | One page object per page of the app                                          |
| `components/`        | Parts on more than one page: menu, rows, dialogs, card frame, chart, banners |
| `fixtures/`          | `test-fixtures.ts`, the `test` object every spec imports                     |
| `builders/`          | `account-state-builder.ts`, which writes an exact account into storage       |
| `data/`              | Demo accounts, the 8 stocks, every message a test checks, renamed labels     |
| `config/`            | Which site to test, the seed, the clock, the locale and the time zone        |
| `checks/`            | Checks shared by an everyday test and its bug-hunt twin                      |
| `utils/`             | Money, page paths, the frozen clock, the healing helper, the a11y scan       |
| `reporters/`         | The bug-hunt score, the heal report and the flaky list                       |
| `scripts/`           | The tag check, the coverage table and the nightly history, as plain Node     |
| `ai/`                | The AI triage and heal-suggestion scripts, and their prompts                 |
| `specs/`             | Test plans written by the Playwright planner agent                           |
| `docs/`              | The requirement list, the coverage table, the AI guides                      |
| `exploratory-notes/` | Notes from AI exploratory sessions. Notes only, never code                   |
| `.github/`           | The CI workflows, Dependabot, the PR template and the issue forms            |

## How to write a test here

1. **Put it in `tests/<area>/<thing>.spec.ts`.** One behaviour per test.

2. **Import the fixture, never `@playwright/test` directly.**

   ```ts
   import { test, expect } from '../../fixtures/test-fixtures';
   ```

   The fixture hands you page objects already carrying the app's switches, a
   frozen clock and the popup handlers.

3. **Start from a saved login.** `test.use({ storageState: TRADER.storageState })`
   inside the `describe`. The three accounts are `TRADER`, `NEWBIE` and `BUSY`
   in `data/demo-accounts.ts`.

4. **Use page objects and components, never raw locators in a spec.** A test
   says `await stockPage.enterShares(5)`, never `page.locator('#shares')`. A
   locator you need and cannot find goes into the page object in `pages/` or the
   component in `components/` first.

5. **Build the starting state, do not click to it.** The `accountState` fixture
   writes the exact account into storage before the page loads:

   ```ts
   await accountState.forUser(TRADER).withCash(50_000).withNoHoldings().apply();
   await walletPage.goto();
   await accountState.expectApplied();
   ```

   `expectApplied()` is not optional. The app silently falls back to its demo
   data when a shape does not fit, and that call is what turns the silence into
   a clear failure.

6. **Never type a message into a test.** Every word the app shows is in
   `data/expected-text.ts`, copied from the app's `js/ui-text.js`. Import it
   from there. Messages with a number in them are small functions in the same
   file.

7. **Work the numbers out from what the app quotes.** Prices move. Read
   `data-cents` with `centsOf()` from `utils/money.ts` and do the arithmetic;
   never type a figure.

8. **Locator order: role, then label, then test id.** Buttons, links and fields
   with `getByRole` and `getByLabel`. App data with `getByTestId`, or by the
   `data-` attribute the app marks it with. No class selectors. No XPath.

9. **Critical-path elements get the healing helper.** If the element is on the
   way in, in the trade box, in the top menu or in the card frame, give it
   backup ways with `healing()` from `utils/healing-locator.ts`:

   ```ts
   this.submitButton = healing({
     where: 'LoginPage',
     element: 'submit button',
     ways: [
       {
         how: 'role button named Log in',
         locator: page.getByRole('button', { name: TEXT.login.submit }),
       },
       {
         how: 'role button named log in or sign in',
         locator: page.getByRole('button', { name: LOG_IN }),
       },
     ],
   });
   ```

   The first way is always today's locator, so a normal run behaves exactly as
   before. A heal is a warning, never a fix: it means the app changed and the
   page object is out of date.

10. **No `waitForTimeout`, anywhere.** Waiting is done with web-first
    assertions. Time is moved with Playwright's Clock API —
    `await page.clock.runFor(2_000)` — because the clock is frozen by the
    fixture so two runs on two machines see the same prices.

11. **Assertions are web-first and live in the test.** Page objects and
    components expose locators and do actions. They never assert. The one
    exception is `waitUntilReady()`, which waits for a page's own ready
    element.

## Tags

Every test carries **exactly one priority** and **at least one requirement ID**.
`npm run check:tags` fails otherwise, and so does CI.

| Tag   | Meaning      | What is in it                                                        |
| ----- | ------------ | -------------------------------------------------------------------- |
| `@p1` | Critical     | Logging in, the session guard, buying, selling, money math, payments |
| `@p2` | Important    | Watchlist, profile, history, receipts, market search, offline, idle  |
| `@p3` | Nice to have | Theme, news, chart hover, screenshots, phone layout                  |

Requirement IDs come from [docs/requirements.md](docs/requirements.md), like
`@REQ-TRADE-01`. An ID that is not in that file fails the check. A bug-hunt,
drift or resilience test carries the same ID as its everyday twin, plus the
`@REQ-SWITCH-*` ID for the switch it turns on.

After adding or changing a requirement tag, run
`npm run coverage:requirements` and commit `docs/requirements-coverage.md`.

```ts
test(
  'buying 5 KRYL takes the same cash in the summary, the message and the menu',
  { tag: ['@smoke', '@regression', '@p1', '@REQ-TRADE-01'] },
  async ({ stockPage }) => {
    /* ... */
  },
);
```

## Running things

| Command                      | What it runs                                  |
| ---------------------------- | --------------------------------------------- |
| `npm test`                   | Everything, every project                     |
| `npm run test:critical`      | The `@p1` tests on Chromium                   |
| `npm run test:smoke`         | The main journeys                             |
| `npm run test:regression`    | The everyday suite                            |
| `npm run test:a11y`          | The accessibility scans                       |
| `npm run test:visual`        | The screenshots, Chromium only                |
| `npm run test:mobile`        | The phone project                             |
| `npm run test:cross-browser` | Firefox and WebKit                            |
| `npm run test:bug-hunt`      | The app's five bugs, switched on              |
| `npm run test:drift`         | The app renamed, re-id'd, moved and popped up |
| `npm run test:resilience`    | The app slow, and dropping requests           |
| `npm run test:quarantine`    | The parked tests                              |

The four checks that must pass before you say you are done:

```bash
npm run lint
npm run format:check
npm run check:tags
npm run typecheck
```

A new test must also pass `--repeat-each=3`:

```bash
npx playwright test tests/<area>/<thing>.spec.ts --project=chromium --repeat-each=3
```

## The AI parts

- `ai/` calls Groq or Gemini with plain `fetch`. **No AI SDK packages.**
- An AI answer is **data in a fixed shape**. `ai/check-shape.mjs` checks it, and
  the script builds whatever it needs from the checked fields itself.
- **No code written by an AI is ever run.** A locator suggestion is a
  description — strategy, role, name — and the script builds the Playwright
  locator from it.
- `ai/redact.mjs` strips anything that looks like a key or a token before a
  single byte leaves the machine.
- Every AI step writes a report a person reads. It never edits a page object,
  never messages anyone, never opens an issue and never fails a run.
- No key or no provider: the step prints one clear note and exits successfully.

See [docs/ai-agents-walkthrough.md](docs/ai-agents-walkthrough.md) and
[docs/exploratory-testing-guide.md](docs/exploratory-testing-guide.md).

## Hard rules

- **Never change `../Practice-App`.** The app under test is somebody else's
  repository. If a test fails because the app is wrong, say so in the report
  and stop.
- **Never send a message, open an issue or comment on a pull request.**
- **Never commit a secret.** No key, token or `.env` file goes into git.
  `.env.example` is the only one that is committed.
- **Never commit a deliberately broken test.** If you break a locator to
  exercise the healer, put it back exactly as it was first.
- **A new test must pass with `--repeat-each=3`.** Every time, not most times.
- **Never use `test.only`, `test.skip`, `{ force: true }` or `page.pause()`.**
  ESLint makes each of these an error on purpose.
- **Do not reach into the app's source at run time.** What the tests need is
  copied into `data/`.

[CONTRIBUTING.md](CONTRIBUTING.md) is the same ground in more words, for a
person.
