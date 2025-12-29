import { test, expect } from '@playwright/test';

/**
 * 인증 관련 E2E 테스트
 * - 로그인 페이지 접근
 * - 비인증 상태에서 보호된 페이지 리다이렉트
 */

test.describe('Authentication', () => {
  test('로그인 페이지가 정상적으로 로드되어야 함', async ({ page }) => {
    await page.goto('/login');

    // 로그인 페이지 요소 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /로그인|sign in/i })).toBeVisible();
  });

  test('비인증 상태에서 대시보드 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    await page.goto('/dashboard');

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/login/);
  });

  test('비인증 상태에서 고객 페이지 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    await page.goto('/customers');

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/login/);
  });

  test('비인증 상태에서 프로그램 페이지 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    await page.goto('/programs');

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/login/);
  });
});
