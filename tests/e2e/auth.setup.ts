import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

/**
 * 인증 설정 - 테스트 전 로그인 상태 저장
 *
 * 테스트 실행 전 실행되어 인증된 상태를 저장합니다.
 * 다른 테스트에서 storageState를 사용하여 인증 상태를 재사용합니다.
 *
 * 주의: 실제 테스트 계정 정보를 환경변수로 설정해야 합니다.
 * - TEST_USER_EMAIL
 * - TEST_USER_PASSWORD
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  // 테스트 계정이 설정되지 않은 경우 스킵
  if (!email || !password) {
    console.log('Test credentials not provided. Skipping auth setup.');
    return;
  }

  // 로그인 페이지 이동
  await page.goto('/login');

  // 이메일/비밀번호 입력
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // 로그인 버튼 클릭
  await page.getByRole('button', { name: /로그인|sign in/i }).click();

  // 로그인 성공 확인 (대시보드로 리다이렉트)
  await expect(page).toHaveURL(/\/(dashboard|customers)/);

  // 인증 상태 저장
  await page.context().storageState({ path: authFile });
});
