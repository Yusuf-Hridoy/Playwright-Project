// Accessibility problems the app really has.
//
// The accessibility tests fail on any serious or critical problem. A rule is
// skipped only when the app is genuinely wrong and the fix belongs in the app,
// never to make a test pass. Every entry names the page, the axe rule and the
// reason, and every entry is a bug waiting to be fixed in ../Practice-App.
//
// The list is empty. The two problems that used to sit here were both fixed in
// the app, so every rule is checked on every page again:
//
//   1. js/top-menu.js, avatarHtml(): the profile circle showed the initials
//      "TR" while its aria-label was only "Your profile". The label now starts
//      with the visible text ("TR, your profile"), or with the display name
//      when a photo leaves no visible text.
//   2. js/pages/login-page.js: the "How it works" link inside the footer
//      paragraph was told apart from the words around it by colour alone.
//      Links are underlined now, in both themes.

/** The pages the accessibility pass walks, in the order it walks them. */
export type A11yPage =
  | 'login'
  | 'market'
  | 'stock'
  | 'portfolio'
  | 'wallet'
  | 'watchlist'
  | 'news'
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

/** Nothing is skipped today: every rule is checked on every page. */
export const A11Y_KNOWN_ISSUES: readonly KnownIssue[] = Object.freeze([]);

/** The rules to leave out on one page. Everything else still has to pass. */
export function knownRulesFor(page: A11yPage): string[] {
  return A11Y_KNOWN_ISSUES.filter((issue) => issue.page === page).map((issue) => issue.rule);
}
