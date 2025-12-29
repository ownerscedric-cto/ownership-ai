import { test, expect } from '@playwright/test';

/**
 * 홈페이지 E2E 테스트
 * - 메인 페이지 로드
 * - 네비게이션 요소
 */

test.describe('Homepage', () => {
  test('홈페이지가 정상적으로 로드되어야 함', async ({ page }) => {
    await page.goto('/');

    // 페이지 로드 확인 (로그인 페이지 또는 메인 페이지)
    await expect(page).toHaveURL(/\/(login)?$/);
  });

  test('페이지 제목이 설정되어 있어야 함', async ({ page }) => {
    await page.goto('/');

    // 페이지 제목 확인
    await expect(page).toHaveTitle(/.+/);
  });
});
