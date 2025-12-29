import { test, expect } from '@playwright/test';

/**
 * 대시보드 E2E 테스트
 *
 * 시나리오:
 * 1. 대시보드 로드 및 통계 표시
 * 2. 차트 렌더링
 * 3. 기간 필터링
 * 4. 리포트 생성
 */

test.describe('Dashboard', () => {
  test.describe('Unauthenticated Access', () => {
    test('비인증 상태에서 대시보드 접근 시 로그인으로 리다이렉트', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // 인증 상태 테스트
  test.describe.skip('Authenticated - Dashboard View', () => {
    test('대시보드 메인 페이지 로드', async ({ page }) => {
      await page.goto('/dashboard');

      // 대시보드 헤더 확인
      await expect(page.getByRole('heading', { name: /대시보드|dashboard/i })).toBeVisible();
    });

    test('주요 통계 카드 표시', async ({ page }) => {
      await page.goto('/dashboard');

      // 통계 카드 확인
      await expect(page.getByText(/총 고객/i)).toBeVisible();
      await expect(page.getByText(/총 프로그램/i)).toBeVisible();
      await expect(page.getByText(/매칭 완료/i)).toBeVisible();
    });

    test('트렌드 차트 렌더링', async ({ page }) => {
      await page.goto('/dashboard');

      // 차트 컴포넌트 로딩 대기
      await page.waitForSelector('[data-testid="trend-chart"]', { timeout: 10000 });

      // 차트 표시 확인
      await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
    });

    test('데이터 소스별 차트 렌더링', async ({ page }) => {
      await page.goto('/dashboard');

      // 데이터 소스별 차트 로딩 대기
      await page.waitForSelector('[data-testid="source-chart"]', { timeout: 10000 });

      // 차트 표시 확인
      await expect(page.locator('[data-testid="source-chart"]')).toBeVisible();
    });

    test('기간 필터 선택', async ({ page }) => {
      await page.goto('/dashboard');

      // 기간 선택기 확인
      const periodSelector = page.locator('[data-testid="period-selector"]');
      if (await periodSelector.isVisible()) {
        await periodSelector.click();

        // 옵션 선택 (예: 최근 30일)
        await page.click('text=최근 30일');

        // 데이터 리로드 대기
        await page.waitForLoadState('networkidle');

        // 선택된 기간 표시 확인
        await expect(periodSelector).toContainText('30일');
      }
    });

    test('리포트 생성 버튼', async ({ page }) => {
      await page.goto('/dashboard');

      // 리포트 생성 버튼 확인
      const reportButton = page.getByRole('button', { name: /리포트|report|PDF/i });
      if (await reportButton.isVisible()) {
        await reportButton.click();

        // 리포트 생성 다이얼로그 또는 다운로드 시작 확인
        await expect(
          page.getByRole('dialog').or(page.getByText(/생성 중|generating/i))
        ).toBeVisible();
      }
    });

    test('고객별 리포트 생성', async ({ page }) => {
      await page.goto('/dashboard');

      // 고객별 리포트 버튼 클릭
      const customerReportButton = page.getByRole('button', {
        name: /고객 리포트|customer report/i,
      });
      if (await customerReportButton.isVisible()) {
        await customerReportButton.click();

        // 고객 선택 다이얼로그 표시
        await expect(page.getByRole('dialog')).toBeVisible();

        // 고객 선택
        await page.locator('[data-testid="customer-option"]').first().click();

        // 생성 버튼 클릭
        await page.getByRole('button', { name: /생성|generate/i }).click();

        // PDF 미리보기 또는 다운로드 확인
        await page.waitForLoadState('networkidle');
      }
    });
  });
});

test.describe('Dashboard - Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test.describe.skip('Authenticated - Mobile View', () => {
    test('모바일에서 대시보드 정상 표시', async ({ page }) => {
      await page.goto('/dashboard');

      // 대시보드 헤더 확인
      await expect(page.getByRole('heading', { name: /대시보드/i })).toBeVisible();

      // 통계 카드가 스크롤 가능하게 표시
      await expect(page.getByText(/총 고객/i)).toBeVisible();
    });

    test('모바일에서 차트 스크롤', async ({ page }) => {
      await page.goto('/dashboard');

      // 차트 영역으로 스크롤
      await page.locator('[data-testid="trend-chart"]').scrollIntoViewIfNeeded();

      // 차트 표시 확인
      await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
    });
  });
});
