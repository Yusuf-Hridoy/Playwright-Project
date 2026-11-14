// Accessibility problems the app really has.
//
// The accessibility tests fail on any serious or critical problem. A rule is
// skipped only when the app is genuinely wrong and the fix belongs in the app,
// never to make a test pass. Every entry names the page, the axe rule and the
// reason, and every entry is a bug waiting to be fixed in ../Practice-App.
//
// Two real problems are listed below, and both are in shared markup, so one
// fix in the app clears several lines at once:
//
//   1. js/top-menu.js, avatarHtml(): the circle shows the initials "TR" but
//      its aria-label is "Your profile", so the name a person says out loud is
//      not the name the screen reader hears. Every signed-in page has it.
//   2. js/pages/login-page.js: the "How it works" link sits inside a paragraph
//      and is told apart from the words around it by colour alone.

/** The pages the accessibility pass walks, in the order it walks them. */
export type A11yPage =
  | 'login'
  | 'market'
  | 'stock'
  | 'portfolio'
  | 'wallet'
  | 'watchlist'
  | 'profile'
  | 'rules';

export interface KnownIssue {
  /** Which page the problem is on. */
  readonly page: A11yPage;
  /** The axe rule id, like "color-contrast". */
  readonly rule: string;
  /** One sentence on what the app does wrong. */
  readonly why: string;
}

/** The accessible name of the profile circle leaves out the initials it shows. */
const MENU_AVATAR_RULE = 'label-content-name-mismatch';
const MENU_AVATAR_WHY =
  'The profile circle in the top menu shows the initials of the display name, but its aria-label is only "Your profile", so its visible text is not part of its accessible name.';

const SIGNED_IN_PAGES: readonly A11yPage[] = [
  'market',
  'stock',
  'portfolio',
  'wallet',
  'watchlist',
  'profile',
  'rules',
];

export const A11Y_KNOWN_ISSUES: readonly KnownIssue[] = Object.freeze([
  {
    page: 'login' as const,
    rule: 'link-in-text-block',
    why: 'The "How it works" link inside the blurb is told apart from the text around it by colour alone, with no underline and too little contrast against it.',
  },
  ...SIGNED_IN_PAGES.map((page) => ({
    page,
    rule: MENU_AVATAR_RULE,
    why: MENU_AVATAR_WHY,
  })),
]);

/** The rules to leave out on one page. Everything else still has to pass. */
export function knownRulesFor(page: A11yPage): string[] {
  return A11Y_KNOWN_ISSUES.filter((issue) => issue.page === page).map((issue) => issue.rule);
}
