import { test, expect } from '@playwright/test';

/**
 * 정부지원사업 프로그램 E2E 테스트
 * - 프로그램 목록 페이지
 * - 필터링 기능
 * - 검색 기능
 */

test.describe('Programs (Unauthenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // 비인증 상태에서는 로그인 페이지로 리다이렉트됨
    await page.goto('/programs');
  });

  test('비인증 상태에서 로그인 페이지로 리다이렉트', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
  });
});

// 인증된 상태에서의 테스트는 별도 fixture 필요
// test.describe('Programs (Authenticated)', () => {
//   test.use({
//     storageState: './tests/.auth/user.json',
//   });
//
//   test('프로그램 목록이 표시되어야 함', async ({ page }) => {
//     await page.goto('/programs');
//     await expect(page.getByRole('heading', { name: /정부지원사업/i })).toBeVisible();
//   });
// });
