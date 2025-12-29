import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 *
 * 테스트 실행 방법:
 * - npm run test:e2e           : 전체 테스트 실행
 * - npm run test:e2e:ui        : UI 모드로 실행
 * - npm run test:e2e:report    : 테스트 리포트 보기
 *
 * 인증된 상태로 테스트 실행:
 * 1. .env.local에 TEST_USER_EMAIL, TEST_USER_PASSWORD 설정
 * 2. auth.setup.ts가 인증 상태를 저장
 * 3. 각 테스트에서 storageState를 사용하여 인증 상태 재사용
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // 인증 설정 프로젝트 (테스트 전 실행)
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // 비인증 테스트 (로그인 필요 없는 테스트)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /.*\.setup\.ts/,
    },

    // 인증된 상태 테스트 (setup 후 실행)
    // 테스트 계정이 설정된 경우 활성화
    // {
    //   name: 'chromium-authenticated',
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     storageState: './tests/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    //   testIgnore: /.*\.setup\.ts/,
    // },

    // 모바일 테스트
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testIgnore: /.*\.setup\.ts/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
