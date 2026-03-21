import type { Page, Response } from '@playwright/test';

export async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForSelector('#root > *', { timeout: 10_000 });
}

export async function waitForNetworkIdle(page: Page, timeout = 5_000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

export async function waitForApiResponse(
  page: Page,
  pathPattern: string | RegExp,
): Promise<Response> {
  const pattern = typeof pathPattern === 'string' ? new RegExp(pathPattern) : pathPattern;
  return page.waitForResponse((response) => pattern.test(response.url()));
}
