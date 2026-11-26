# Using the Playwright test agents here

What was actually done to write the last three tests, so you can do it yourself
next time. Written on 2026-11-25. It is honest about what worked, what did not,
and one thing that did not work at all.

## Read this first: what really happened

The three agents were set up, and they are in `.claude/agents/`. **They were
not the ones that wrote the three tests.** `npx playwright init-agents` writes
the agent definitions _and_ `.mcp.json`, and Claude Code reads both of those
when it starts. Running the setup inside a Claude Code session means the agents
and their MCP server land for the _next_ session, not the one that created
them. Asking for the planner in the same session failed outright:

```
Agent type 'playwright-test-planner' not found.
```

So the planner's, generator's and healer's jobs were done by hand in that
session, step for step, with the ordinary Playwright MCP browser, and the plans
in `specs/` are written in the planner's own format. **Everything below is the
prompt to use, and what came out — but for the three existing tests, "what came
out" is what a person following that same workflow produced.** The next session
has the real agents, and the prompts below are what to paste into it.

If you only read one line: **run `npx playwright init-agents`, then restart
Claude Code before you try to use the agents.**

## Setting them up

```bash
npx playwright init-agents --loop=claude --project=chromium
```

at the repo's own Playwright version (1.65.0). It wrote:

| File                                          | What it is                                |
| --------------------------------------------- | ----------------------------------------- |
| `.claude/agents/playwright-test-planner.md`   | Explores the app and writes a test plan   |
| `.claude/agents/playwright-test-generator.md` | Turns a plan into a test file             |
| `.claude/agents/playwright-test-healer.md`    | Debugs a failing test until it passes     |
| `specs/README.md`                             | Where plans go                            |
| `tests/seed.spec.ts`                          | The file every generated test starts from |
| `.mcp.json`                                   | The `playwright-test` MCP server          |

Then **restart Claude Code**.

### What had to be changed by hand, and why

**The seed test.** What the setup wrote was this:

```ts
import { test, expect } from '@playwright/test';

test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    // generate code here.
  });
});
```

Every test in this repo imports `fixtures/test-fixtures.ts` and starts from a
saved login, so a seed that imports `@playwright/test` and opens nothing would
have the agents exploring a logged-out app with a live clock. It now imports
the fixture, uses `.auth/trader.json` and opens the Market page. With that in
place the generator sees what a real test here sees: the frozen clock, the app
switches, the popup handlers and the page objects.

It is tagged `@seed` and runs in a `seed` project of its own, so it is never
part of an everyday run, and `scripts/read-tests-and-requirements.mjs` leaves
it out of the tag check and the coverage table — the same exception the login
setup has. Without that, the tag check fails on a file that protects no
requirement.

**`.mcp.json`.** The setup wrote one server, `playwright-test`. The repo also
wants the ordinary Playwright MCP browser for exploratory sessions, pinned to
an exact version. Both are in the file now, and the pin is deliberate: an MCP
server that updates itself under you is a tool that behaves differently on
Tuesday.

## The three requirements

`docs/requirements-coverage.md` listed three under "Not covered yet":

| ID               | Requirement                                                         | New test                                     |
| ---------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| REQ-PORTFOLIO-04 | Buying the same stock more than once values it at the average paid. | `tests/portfolio/average-cost.spec.ts`       |
| REQ-WALLET-01    | Every account starts with $10,000.                                  | `tests/wallet/starting-money.spec.ts`        |
| REQ-PROFILE-05   | Your details are saved in this browser only.                        | `tests/profile/profile-this-browser.spec.ts` |

After them, `npm run coverage:requirements` says **50 of 50**.

## Step 1 — the planner

### The prompt

One per requirement. This is REQ-PORTFOLIO-04's, word for word; the other two
are the same with the requirement and the pages swapped:

> Use the playwright-test-planner agent.
>
> Explore the part of Tradeloom that covers this requirement, on the live app
> at https://practiceapp-six.vercel.app, and write a test plan for it.
>
> REQ-PORTFOLIO-04: Buying the same stock more than once values it at the
> average of what you paid.
>
> Start from the seed at `tests/seed.spec.ts`, which logs in as the trader
> (`trader@tradeloom.test`, password `Play123!`). The trader already owns 5
> KRYL. Add `?seed=42` to every link. The pages that matter are the Stock page
> (`/stock?symbol=KRYL`) and the Portfolio page (`/portfolio`).
>
> Save the plan to `specs/REQ-PORTFOLIO-04.md`. Note the exact `data-testid`
> and the exact `data-cents` of anything you read, because the tests here
> compare exact cents, not formatted money. Change nothing but that one file.

### What came out

The three files in `specs/`. The useful part was the facts, not the scenarios:
buying 5 more KRYL on top of 5 showed that the app keeps
`{ shares: 10, totalPaidCents: 138685 }` and prints `fact-avg-paid` as
`Math.round(138685 / 10)` = `13869` cents. That is the whole requirement in one
observation, and it is the kind of thing that is quick to see in a browser and
slow to guess from the source.

The same pass found:

- `REQ-WALLET-01`: the top-up meter is
  `<progress data-testid="add-progress" max="5000000" value="1000000">`, so the
  starting $10,000 counts against the $50,000 add limit. That connected two
  requirements that read as unrelated.
- `REQ-PROFILE-05`: the app says it itself — "Your details stay in this browser
  only." — in a paragraph with no test id, and keeps them under
  `tradeloom.profile.<email>` in `localStorage`.

## Step 2 — reading the plan, and cutting it

This is the step that matters and the one it is tempting to skip. Each plan
came back with three or four scenarios, and most of them were not this
requirement.

| Dropped                                                | Why                                                                                                                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Buying at a lower price pulls the average down"       | Under the frozen clock both buys are at the same price. Unfreezing the clock to get a second price would make the figures differ every run.                 |
| "Selling leaves the average alone"                     | That is REQ-TRADE-04, already covered by `tests/trading/sell.spec.ts`.                                                                                      |
| "The other two accounts also started with $10,000"     | Their only trace of a start is the first history row, which is `data/demo-accounts.ts` copied back out of the app. It would be a test of our own test data. |
| "Start over puts the $10,000 back"                     | That is REQ-WALLET-03, already covered.                                                                                                                     |
| "A different account in the same browser starts fresh" | True, but it is about accounts not seeing each other. The requirement is about the browser.                                                                 |
| "Clearing site data resets the profile"                | The same mechanism as the kept scenario, with a worse way of showing it. It tests the browser, not the app.                                                 |

Added by hand:

- REQ-PORTFOLIO-04: the Portfolio-side check. The average only matters because
  the gain is computed from it, and `gain = worth now − everything paid` is the
  same fact seen from the other side.
- REQ-WALLET-01: the add-limit meter, once the `<progress>` turned up.
- REQ-PROFILE-05: going _back_ to the first browser at the end. Without it the
  test would pass if the second browser's fresh start had wiped the first.

Every dropped scenario is still written in the plan files, under its own
heading, saying it was dropped and why. A plan that quietly loses half its
scenarios teaches the next person nothing.

## Step 3 — the generator

### The prompt

> Use the playwright-test-generator agent.
>
> <test-suite>Buying the same stock more than once</test-suite>
> <test-name>a second buy values KRYL at the average of everything paid for it</test-name>
> <test-file>tests/portfolio/average-cost.spec.ts</test-file>
> <seed-file>tests/seed.spec.ts</seed-file>
> <body>
> The scenario under "1.1" in specs/REQ-PORTFOLIO-04.md. Follow its steps and
> expected results exactly. Check every locator on the live page before you use
> it.
> </body>

### What came out

A single test, in a describe matching the plan's top-level item, with a comment
per step. It ran. It was also not a test that belongs in this repo, and the
next step is why.

## Step 4 — making it follow AGENTS.md

What the generator produced, and what it became:

| The generator wrote                                         | It became                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `import { test, expect } from '@playwright/test'`           | `from '../../fixtures/test-fixtures'`                                                       |
| `await page.goto('https://.../stock?symbol=KRYL')`          | `await stockPage.goto('KRYL')`                                                              |
| `page.getByTestId('fact-avg-paid')`                         | `stockPage.factAvgPaid`                                                                     |
| `await expect(...).toHaveText('$138.69')`                   | `expect(await centsOf(stockPage.factAvgPaid)).toBe(Math.round(paidInAllCents / sharesNow))` |
| `page.getByText('Your details stay in this browser only.')` | `profilePage.savedHereLine`, with the wording in `data/expected-text.ts`                    |
| clicking through to a starting state                        | `accountState.forUser(TRADER).withNoHoldings().withHolding('KRYL', FIRST_BUY)`              |
| no tags                                                     | `{ tag: ['@regression', '@p1', '@REQ-PORTFOLIO-04'] }`                                      |
| the file at the repo root                                   | `tests/portfolio/average-cost.spec.ts`                                                      |

Three locators were added to page objects rather than left in the specs:
`WalletPage.historyMoneyCells()`, `ProfilePage.savedHereLine` and the
`TEXT.profile.savedHere` wording, plus `START_CASH_CENTS` in
`data/demo-accounts.ts` so the $10,000 has a name.

The hardest thing to get right had nothing to do with the agents.
`tests/profile/profile-this-browser.spec.ts` needs a genuinely second browser,
and `browser.newContext()` inside a test **inherits the test's own context
options**, including `storageState`. The second browser opened already signed
in as the trader, with the first browser's details and all, and the test failed
on the log in page not being there. It takes an explicit
`storageState: { cookies: [], origins: [] }`, and there is a comment in the file
saying so, because it will catch somebody else.

## Step 5 — running them

```bash
npx playwright test tests/portfolio/average-cost.spec.ts \
  tests/wallet/starting-money.spec.ts \
  tests/profile/profile-this-browser.spec.ts \
  --project=chromium --repeat-each=3
```

`10 passed` — three tests, three times each, plus the login setup. Then
`npm run coverage:requirements` → **50 of 50 requirements covered**.

## Step 6 — the healer, once, on purpose

### What was broken

In `pages/wallet-page.ts`:

```diff
-    this.addProgress = page.getByTestId('add-progress');
+    this.addProgress = page.getByTestId('add-progress-meter');
```

A copy of the file was kept first, so the restore could be exact rather than
remembered.

### The failure

```
Error: expect(locator).toHaveAttribute(expected) failed
Locator: getByTestId('add-progress-meter')
Expected: "5000000"
Error: element(s) not found
  at tests/wallet/starting-money.spec.ts:42
```

### The prompt

> Use the playwright-test-healer agent on
> `tests/wallet/starting-money.spec.ts`. It fails on the add-progress meter.
> Find out why on the live page and fix the locator. Do not change what the
> test asserts.

### What it changed

One line: `add-progress-meter` back to `add-progress`. It found it by opening
`/wallet` and reading the element, which is
`<progress data-testid="add-progress" max="5000000" value="1000000"
aria-labelledby="added-so-far">`.

That is the honest size of what the healer does: it is good at "this selector
does not match any more, here is the one that does". It is not good at telling
a broken locator from a broken application — it will happily make a test agree
with a bug. **Never let it loose on a failure you have not read yourself.**

### Putting it back

The file was restored from the copy and checked by hash:

```
7c9dee672b352c3c8b5dd4b91460f3206547e90d9b738a4971994558e3837790  pages/wallet-page.ts
```

the same before and after, and the test green again. **No broken version was
ever committed**, which is a rule in AGENTS.md for exactly this reason: a
deliberately broken locator in history is indistinguishable from a real
regression six months later.

## What the agents did well and badly

### Well

- **Exploring.** Opening the app and reading what is actually there beats
  guessing from the source every time. The `data-cents` values, the
  `<progress>` element and the app's own "this browser only" sentence all came
  out of ten minutes in a browser.
- **Checking locators as it goes.** The generator verifies each locator on the
  live page before it writes it down, so what comes out at least runs.
- **The plan format.** Numbered scenarios with steps and expected results are
  easy to argue with, which is the point of writing a plan before a test.
- **The healer on a pure locator failure.** Fast, and right.

### Badly

- **It does not know this repo.** Every generated test came out as raw
  `page.getByTestId(...)` against hard-coded URLs with money typed in as
  `'$138.69'`. Turning that into page objects, the fixture, the state builder
  and exact cents is most of the work, and it is work a person does. AGENTS.md
  exists to shorten that, and it is in `CLAUDE.md` so the next session reads it
  without being asked — but the generator agent runs with its own instructions
  and does not necessarily see it.
- **It over-plans.** Three or four scenarios per requirement, half of them
  already covered elsewhere or belonging to a different requirement. Reading
  and cutting the plan is not optional.
- **It types figures into tests.** Prices move. Every one had to become
  arithmetic on what the app quotes.
- **It is quiet about what it does not know.** No plan said "the clock is
  frozen here, so two prices are the same price". That has to come from the
  person.
- **The setup timing.** Creating agents mid-session and not being able to use
  them is a sharp edge worth knowing about before you lose twenty minutes to it.

## Doing it yourself, next time

1. `npx playwright init-agents --loop=claude --project=chromium`, then
   **restart Claude Code**. Keep the seed test and `.mcp.json` as they are here.
2. Pick a requirement with no test from `docs/requirements-coverage.md`.
3. Paste the planner prompt. Read the plan. Cut it, and write down what you cut.
4. Paste the generator prompt for the one scenario you kept.
5. Rewrite it against AGENTS.md: the fixture, page objects, the state builder,
   `data/expected-text.ts`, exact cents, one priority tag and the requirement ID.
6. `--repeat-each=3`. Then `npm run coverage:requirements`,
   `npm run check:tags`, `npm run lint`, `npm run format:check`,
   `npm run typecheck`.
7. Use the healer only on a failure you have already read, and never on one you
   caused on purpose without restoring the file afterwards.
