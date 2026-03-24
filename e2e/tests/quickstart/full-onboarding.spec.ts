import { test, expect } from '@playwright/test';

test.describe('QuickStart — Full Onboarding Journey', () => {
  test('QS-001: Root URL redirects to onboarding page', async ({ page }) => {
    // 유저 행동: 브라우저에서 http://localhost:5173/ 열기
    await page.goto('/');
    await page.waitForURL('**/onboarding', { timeout: 15_000 });

    // 검증: onboarding 페이지 도달 (identify step 포함)
    expect(page.url()).toContain('/onboarding');

    // 검증: 이름 입력 필드와 Get Started 버튼이 보임
    await expect(page.locator('input[placeholder="Enter your name"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('QS-002: New user enters name and reaches project step', async ({ page }) => {
    // 유저 행동: 루트 접속 → 온보딩 → 이름 입력 → Get Started
    await page.goto('/');
    await page.waitForURL('**/onboarding', { timeout: 15_000 });

    const userName = `QS User ${Date.now()}`;
    await page.fill('input[placeholder="Enter your name"]', userName);
    await page.click('button[type="submit"]');

    // 검증: 프로젝트 이름 입력 필드가 보임 (identify step → project step 전환)
    await expect(page.locator('input[placeholder="My Project"]')).toBeVisible({ timeout: 10_000 });
  });

  test('QS-003: Full journey — name, project, dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/onboarding', { timeout: 15_000 });

    // ── 이름 입력 ──
    const userName = `QS Full ${Date.now()}`;
    await page.fill('input[placeholder="Enter your name"]', userName);
    await page.click('button[type="submit"]');

    // ── 프로젝트 생성 스텝 ──
    const projectName = `QS Project ${Date.now()}`;
    const projectInput = page.locator('input[placeholder="My Project"]');
    await projectInput.waitFor({ state: 'visible', timeout: 10_000 });
    await projectInput.fill(projectName);

    // Create Project (Step 1만 있거나 Step 1 → Step 2)
    const nextBtn = page.locator('button:has-text("Next")');
    const createBtn = page.locator('button:has-text("Create Project")');

    if (await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nextBtn.click();
      await createBtn.waitFor({ state: 'visible', timeout: 5_000 });
    }
    await createBtn.click();

    // ── 대시보드 도달 ──
    await page.waitForFunction(
      () =>
        !window.location.pathname.includes('/onboarding') &&
        !window.location.pathname.includes('/identify'),
      { timeout: 15_000 },
    );

    // 검증: 온보딩/identify가 아닌 페이지에 도달
    expect(page.url()).not.toContain('/onboarding');
    expect(page.url()).not.toContain('/identify');

    // 검증: 프로젝트명이 페이지 어딘가에 표시 (사이드바 + 메인에 중복 가능)
    await expect(page.locator(`text=${projectName}`).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
