// Small measurements a test can assert on. Nothing here asserts anything.

import type { Locator, Page } from '@playwright/test';

export interface PageWidths {
  /** How wide the page's content actually is. */
  readonly scrollWidth: number;
  /** How wide the window is. Anything wider than this scrolls sideways. */
  readonly windowWidth: number;
}

/** What the page is, and what it should fit in. */
export async function pageWidths(page: Page): Promise<PageWidths> {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    windowWidth: window.innerWidth,
  }));
}

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Where something sits on screen. Throws if it is not on screen at all. */
export async function boxOf(locator: Locator, what: string): Promise<Box> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error(`${what} is not on screen, so it has no position.`);
  return box;
}
