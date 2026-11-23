# Working on this repo

This is the Playwright test suite for [Tradeloom](https://practiceapp-six.vercel.app).
Short sentences, plain English, and every test earns its place.

## Setting up

```bash
git clone https://github.com/Yusuf-Hridoy/Playwright-Project.git
cd Playwright-Project
npm ci
npx playwright install --with-deps
npm test
```

`npm ci` also installs the Git hook, so the check before each commit works from
the first commit you make. CI skips that step, because CI has no commits to
make.

The suite runs against the live app by default. To point it somewhere else,
copy `.env.example` to `.env` and set `BASE_URL`, or set `TEST_ENV=local` and
serve the app yourself.

## Adding a test the way the rest of them are written

1. **Put it in the right folder.** `tests/<area>/<thing>.spec.ts`, one
   behaviour per test.
2. **Use the fixtures.** `import { test, expect } from '../../fixtures/test-fixtures'`.
   They hand you page objects already set up with the app's switches, a frozen
   clock, and the popup handlers.
3. **Use the page objects and components.** A test says
   `await stockPage.enterShares(5)`, never `page.locator('#shares')`. If the
   locator you need is not there yet, add it to the page object in `pages/` or
   the component in `components/`.
4. **Build the starting state, do not click to it.** `accountState` writes the
   exact account into storage before the page loads. See
   `builders/account-state-builder.ts`.
5. **Never type a message into a test.** Every word the app shows is in
   `data/expected-text.ts`, copied from the app. Import it from there.
6. **Work the numbers out from what the app quotes**, not from a figure typed
   into the test. Prices move.
7. **Tag it.** See below.
8. **Re-run the coverage table** if you added or changed a requirement tag:
   `npm run coverage:requirements`, and commit `docs/requirements-coverage.md`.

## The two tagging rules

`npm run check:tags` enforces both, and so does CI.

**One priority, exactly one.**

| Tag   | What it means | What is in it                                                                               |
| ----- | ------------- | ------------------------------------------------------------------------------------------- |
| `@p1` | Critical      | Logging in, the session guard, buying, selling, the money math, adding money, card payments |
| `@p2` | Important     | The watchlist, the profile, the history, receipts, market search and filters, offline, idle |
| `@p3` | Nice to have  | The theme, the news box and News page, the chart hover, the screenshots, the phone layout   |

`npm run test:critical` runs only `@p1`, on Chromium, in about half a minute.
It is the run to make before you push anything that touches money.

**At least one requirement.** Every test carries the ID of the behaviour it
protects, like `@REQ-TRADE-01`. The IDs live in
[docs/requirements.md](docs/requirements.md). A test may carry more than one. An
ID that is not in that file fails the check.

A bug-hunt, drift or resilience test uses the same ID as the everyday test that
covers the same behaviour, plus the `@REQ-SWITCH-*` ID for the switch it turns
on. That is how the coverage table shows every angle a requirement is tested
from.

`setup/save-logins.setup.ts` is the one exception. It carries every tag there
is, so it survives any `--grep` and the other projects still find their saved
sessions.

## What happens when you commit

A Git hook runs `lint-staged` over the files you staged, and nothing else:

1. `eslint --fix` fixes what it can.
2. `prettier --write` formats it.
3. The fixed files are put back into the commit.

If ESLint still finds an **error** after its own `--fix`, the commit stops.
Fix it and commit again. Warnings do not stop a commit.

The rules that are errors on purpose are the ones that quietly stop a test from
testing anything: a missing `await`, `waitForTimeout`, `test.only`,
`test.skip`, `{ force: true }`, `page.pause()`, and an assertion that is not
web-first.

## Running each project

| Command                      | What it runs                                   |
| ---------------------------- | ---------------------------------------------- |
| `npm test`                   | Everything, every project                      |
| `npm run test:critical`      | The `@p1` tests on Chromium                    |
| `npm run test:smoke`         | The main journeys                              |
| `npm run test:regression`    | The everyday suite                             |
| `npm run test:a11y`          | The accessibility scans                        |
| `npm run test:visual`        | The screenshots, Chromium only                 |
| `npm run test:mobile`        | The phone project                              |
| `npm run test:cross-browser` | Firefox and WebKit                             |
| `npm run test:bug-hunt`      | The app's five bugs, switched on               |
| `npm run test:drift`         | The app renamed, re-id'd, moved and popped up  |
| `npm run test:resilience`    | The app slow, and the app dropping requests    |
| `npm run test:quarantine`    | The parked tests                               |
| `npm run test:headed`        | Any of the above, with a browser you can watch |

And the checks:

| Command                         | What it does                             |
| ------------------------------- | ---------------------------------------- |
| `npm run lint`                  | ESLint over everything                   |
| `npm run format`                | Prettier, writing                        |
| `npm run format:check`          | Prettier, only telling you               |
| `npm run typecheck`             | `tsc --noEmit`                           |
| `npm run check:tags`            | The two tagging rules                    |
| `npm run coverage:requirements` | Rebuilds `docs/requirements-coverage.md` |

## Quarantine: what to do with a flaky test

A test that passes and fails without the app or the test changing is worse than
no test, because nobody trusts the run any more. Park it instead of deleting
it:

1. Add `@quarantine` to its tags. It now runs only in the `quarantine` project,
   which has no retries, and whose result cannot turn the nightly run red.
2. Open a [flaky test issue](.github/ISSUE_TEMPLATE/flaky-test.yml) with a link
   to a run that failed and the error it printed.
3. Fix the cause. Almost always it is a wait that was not a wait: a fixed sleep,
   a `toBeVisible` on something that is still being drawn, or state left behind
   by another test.
4. Take the tag off, and say in the pull request why it is steady now.

A test does not stay in quarantine. If it cannot be fixed, delete it and write
down which requirement lost its cover.
