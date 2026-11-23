// Backup locators, and a note every time one is used.
//
// A page object hands this helper an ordered list of ways to find one element.
// The first way is always today's normal locator, so a normal run behaves
// exactly as it did before. If the app has moved on and that way no longer
// finds anything, the helper falls back on the next way, and writes down that
// it had to:
//
//   this.submitButton = healing({
//     where: 'LoginPage',
//     element: 'submit button',
//     ways: [
//       { how: 'test id login-submit', locator: page.getByTestId('login-submit') },
//       { how: 'role button named log in or sign in', locator: page.getByRole('button', { name: LOG_IN }) },
//     ],
//   });
//
// What comes back is an ordinary Playwright Locator: page objects keep it in a
// field and tests use it with expect() and with click() as usual. The note is
// an annotation on the running test, which reporters/heal-reporter.ts gathers
// into heal-report/heal-report.md at the end of the run.
//
// Healing is a warning, never a fix. A heal in a normal project means the real
// app changed and the locator in the page object is out of date.
//
// The helper takes no page of its own: every way already carries the page, or
// the frame, it was built from, which is what lets the card form inside the
// payment frame heal the same way the rest of the app does.

import { test, type Locator } from '@playwright/test';

/** The annotation one heal leaves behind. The heal reporter reads these. */
export const HEAL_ANNOTATION = 'healed';

/**
 * How long the helper waits for any of the ways to find something before it
 * gives up and lets the test's own call fail with Playwright's own message.
 */
export const HEAL_WAIT_MS = 5_000;

/** One way of finding an element, and words a person can read for it. */
export interface LocatorWay {
  /** How this way finds the element, for the heal report. */
  readonly how: string;
  readonly locator: Locator;
}

export interface HealingOptions {
  /** The page object the element belongs to, like 'LoginPage'. */
  readonly where: string;
  /** The element in plain words, like 'submit button'. */
  readonly element: string;
  /** Today's locator first, then the backups, in the order to try them. */
  readonly ways: readonly LocatorWay[];
}

/** What is written into the annotation, as JSON. */
export interface HealEvent {
  readonly where: string;
  readonly element: string;
  readonly failed: string;
  readonly used: string;
}

/**
 * One heal per test per element. Several page objects can hold a locator for
 * the same element (every page object has a top menu), and one heal told three
 * times would read like three problems.
 */
const alreadyTold = new Set<string>();

function tellOnce(event: HealEvent): void {
  const info = test.info();
  const key = `${info.testId}|${event.where}|${event.element}|${event.used}`;
  if (alreadyTold.has(key)) return;
  alreadyTold.add(key);
  info.annotations.push({ type: HEAL_ANNOTATION, description: JSON.stringify(event) });
}

/**
 * The Locator methods that actually go and look at the page. Each one is
 * wrapped so the check below runs first. Everything else on the locator,
 * including the builders like .first() and .filter(), is passed straight
 * through untouched.
 *
 * `_expect` is how expect(locator).toBeVisible() and every other web-first
 * assertion reaches the page, so wrapping it is what makes assertions heal
 * as well as clicks.
 */
const LOOKS_AT_THE_PAGE: ReadonlySet<string> = new Set([
  '_expect',
  'allInnerTexts',
  'allTextContents',
  'ariaSnapshot',
  'blur',
  'boundingBox',
  'check',
  'clear',
  'click',
  'count',
  'dblclick',
  'dispatchEvent',
  'dragTo',
  'elementHandle',
  'elementHandles',
  'evaluate',
  'evaluateAll',
  'evaluateHandle',
  'fill',
  'focus',
  'getAttribute',
  'highlight',
  'hover',
  'innerHTML',
  'innerText',
  'inputValue',
  'isChecked',
  'isDisabled',
  'isEditable',
  'isEnabled',
  'isHidden',
  'isVisible',
  'press',
  'pressSequentially',
  'screenshot',
  'scrollIntoViewIfNeeded',
  'selectOption',
  'selectText',
  'setChecked',
  'setInputFiles',
  'tap',
  'textContent',
  'type',
  'uncheck',
  'waitFor',
]);

/**
 * The Locator methods that build another locator out of this one, like
 * .first() or .getByRole(). What they hand back is wrapped in turn, so a
 * locator found inside a healed one still reports the heal that got it there.
 */
const BUILDS_A_LOCATOR: ReadonlySet<string> = new Set([
  'and',
  'contentFrame',
  'filter',
  'first',
  'frameLocator',
  'getByAltText',
  'getByLabel',
  'getByPlaceholder',
  'getByRole',
  'getByTestId',
  'getByText',
  'getByTitle',
  'last',
  'locator',
  'nth',
  'or',
]);

/** Joins the ways into one locator that matches whichever of them is there. */
function anyOf(ways: readonly LocatorWay[]): Locator {
  return ways.slice(1).reduce((chain, way) => chain.or(way.locator), ways[0].locator);
}

export function healing(options: HealingOptions): Locator {
  const { where, element, ways } = options;
  if (ways.length === 0) {
    throw new Error(`${where} ${element} was given no way to find itself.`);
  }
  const first = ways[0];
  if (ways.length === 1) return first.locator;

  const chain = anyOf(ways);
  let checked = false;

  async function checkWhichWayWorks(): Promise<void> {
    // Set before the first await, so a nested call cannot start a second check.
    if (checked) return;
    checked = true;

    // The normal case, and the quick one: today's locator still finds the
    // element, so there is nothing to wait for and nothing to report.
    if ((await first.locator.count()) > 0) return;

    try {
      await chain.first().waitFor({ state: 'attached', timeout: HEAL_WAIT_MS });
    } catch {
      // No way found anything. Say nothing and let the test's own call fail
      // with Playwright's message, which is the one worth reading.
      return;
    }

    for (const way of ways) {
      if ((await way.locator.count()) === 0) continue;
      if (way !== first) tellOnce({ where, element, failed: first.how, used: way.how });
      return;
    }
  }

  // A Proxy, so what the page object hands out is still a Locator: the same
  // fields, the same methods, and expect() still treats it as one.
  return watch(chain, checkWhichWayWorks);
}

/**
 * Wraps one locator so the check runs before it goes near the page, and so
 * anything built out of it is wrapped the same way.
 */
function watch<T extends object>(target: T, check: () => Promise<void>): T {
  return new Proxy(target, {
    get(inner, property) {
      const value = Reflect.get(inner, property, inner) as unknown;
      if (typeof value !== 'function') return value;

      const method = value as (...args: unknown[]) => unknown;
      const name = String(property);

      if (BUILDS_A_LOCATOR.has(name)) {
        return (...args: unknown[]): unknown => {
          const built = method.apply(inner, args);
          return typeof built === 'object' && built !== null ? watch(built, check) : built;
        };
      }

      if (!LOOKS_AT_THE_PAGE.has(name)) return method.bind(inner);

      return async (...args: unknown[]): Promise<unknown> => {
        await check();
        return method.apply(inner, args);
      };
    },
  });
}
