import type { Page } from '@playwright/test';

export async function pressMetaKey(page: Page, key: string): Promise<void> {
  // Use Playwright's keyboard API with Meta modifier
  // Also try dispatching event directly for better compatibility
  try {
    await page.keyboard.down('Meta');
    await page.keyboard.press(key);
    await page.keyboard.up('Meta');
  } catch {
    // Fallback: dispatch event directly
    await page.evaluate((k) => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: k,
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    }, key);
  }
}

export async function openCommandPalette(page: Page): Promise<void> {
  // Try clicking the search button first (more reliable than keyboard shortcut)
  const searchBtn = page.locator('[aria-label="Search sessions"]');
  if (await searchBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await searchBtn.click();
  } else {
    await pressMetaKey(page, 'k');
  }
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 5_000 });
}
