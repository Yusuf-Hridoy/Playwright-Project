// Seeds picked on purpose, for the tests about an app that drops the odd
// request.
//
// With ?flaky=on the app decides each data load with its own rule, in
// ../Practice-App/js/data-loader.js:
//
//   flakyOutcome(seed, path, count)
//     mulberry32(hashKey(`${seed}|${path}|${count}`))
//     the load fails when the first number is under 1/3
//
// `count` is how many loads that page has already asked for, so the same seed
// gives the same run of failures every time, in the same order. That is what
// makes a flaky app testable at all.
//
// How the seed below was found: with a browser open on
// /market?flaky=on&seed=N, for N from 1 upward, looking for a page where the
// stock list failed on the first try and loaded on "Try again". Seeds 5, 11,
// 18, 22, 26 and 34 all do that; 21, 25, 28 and 30 fail twice over, and most
// of the rest never fail at all.
//
// If the app's rule ever changes, walk the seeds again the same way and put
// the new number here. Nothing imports the app's own code to work it out: a
// number that was checked by hand and written down beats a number worked out
// twice, once in the app and once in the suite.

/**
 * The Market page's stock list fails on the first go and loads on the second.
 * Checked by hand against the live app on 2026-11-19.
 */
export const STOCKS_FAIL_THEN_LOAD_SEED = '11';
