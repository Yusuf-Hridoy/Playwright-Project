// Money helpers. Cents in, the app's own text out.
//
// The app formats with Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
// in js/money-format.js, so these two agree by construction instead of by guesswork.

import type { Locator } from '@playwright/test';
import { LOCALE } from '../config/test-settings';

const US_DOLLARS = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'USD' });

/** 880840 -> "$8,808.40" */
export function money(cents: number): string {
  return US_DOLLARS.format(Math.round(cents) / 100);
}

/** 820 -> "+$8.20", -11400 -> "-$114.00", 0 -> "$0.00" */
export function signedMoney(cents: number): string {
  const whole = Math.round(cents);
  if (whole > 0) return `+${money(whole)}`;
  if (whole < 0) return `-${money(-whole)}`;
  return money(0);
}

/**
 * Reads the data-cents attribute the app puts on every money value.
 * Tests compare against this instead of against a number typed by hand.
 */
export async function centsOf(locator: Locator): Promise<number> {
  const raw = await locator.getAttribute('data-cents');
  if (raw === null) {
    throw new Error('This element has no data-cents attribute, so its exact value cannot be read.');
  }
  const cents = Number(raw);
  if (!Number.isInteger(cents)) {
    throw new Error(`data-cents should be whole cents, but it is "${raw}".`);
  }
  return cents;
}
