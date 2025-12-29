import { test, expect } from '@playwright/test';

/**
 * AI 매칭 E2E 테스트
 *
 * 시나리오:
 * 1. 고객 선택 후 매칭 실행
 * 2. 매칭 결과 확인
 * 3. 매칭 점수 필터링
 * 4. 매칭 결과에서 관심목록 추가
 */

test.describe('Matching Flow', () => {
  test.describe('Unauthenticated Access', () => {
    test('비인증 상태에서 매칭 페이지 접근 시 로그인으로 리다이렉트', async ({ page }) => {
      await page.goto('/customers/some-id/matching');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // 인증 상태 테스트
  test.describe.skip('Authenticated - Matching Execution', () => {
    test('고객 선택 후 매칭 결과 페이지 접근', async ({ page }) => {
      await page.goto('/customers');

      // 첫 번째 고객 선택
      await page.locator('[data-testid="customer-row"]').first().click();

      // 매칭 결과 탭 클릭
      await page.click('text=매칭 결과');

      // 매칭 실행 버튼 또는 기존 매칭 결과 확인
      await expect(
        page
          .getByRole('button', { name: /매칭 실행|AI 매칭/i })
          .or(page.locator('[data-testid="matching-result"]'))
      ).toBeVisible();
    });

    test('매칭 실행 및 결과 표시', async ({ page }) => {
      await page.goto('/customers');

      // 첫 번째 고객 선택
      await page.locator('[data-testid="customer-row"]').first().click();

      // 매칭 결과 탭 클릭
      await page.click('text=매칭 결과');

      // 매칭 실행 버튼 클릭
      const matchButton = page.getByRole('button', { name: /매칭 실행|AI 매칭/i });
      if (await matchButton.isVisible()) {
        await matchButton.click();

        // 로딩 상태 확인
        await expect(page.getByText(/매칭 중|분석 중|loading/i)).toBeVisible();

        // 결과 로딩 대기 (최대 30초)
        await page.waitForSelector('[data-testid="matching-result"]', { timeout: 30000 });
      }

      // 매칭 결과 표시 확인
      await expect(page.locator('[data-testid="matching-result"]')).toBeVisible();
    });

    test('매칭 결과 점수 표시', async ({ page }) => {
      await page.goto('/customers');

      // 첫 번째 고객 선택
      await page.locator('[data-testid="customer-row"]').first().click();

      // 매칭 결과 탭 클릭
      await page.click('text=매칭 결과');

      // 매칭 결과가 있으면 점수 표시 확인
      const results = page.locator('[data-testid="matching-result"]');
      const count = await results.count();

      if (count > 0) {
        // 점수 바 또는 퍼센트 표시 확인
        await expect(
          results.first().locator('[data-testid="score-bar"]').or(results.first().getByText(/점|%/))
        ).toBeVisible();
      }
    });

    test('매칭 결과 필터링', async ({ page }) => {
      await page.goto('/customers');

      // 첫 번째 고객 선택
      await page.locator('[data-testid="customer-row"]').first().click();

      // 매칭 결과 탭 클릭
      await page.click('text=매칭 결과');

      // 필터 존재 시 테스트
      const minScoreFilter = page.locator('[data-testid="min-score-filter"]');
      if (await minScoreFilter.isVisible()) {
        // 최소 점수 60점으로 설정
        await minScoreFilter.fill('60');

        // 필터 적용 대기
        await page.waitForLoadState('networkidle');

        // 결과가 60점 이상인지 확인
        const results = page.locator('[data-testid="matching-result"]');
        const count = await results.count();

        if (count > 0) {
          // 첫 번째 결과의 점수가 60점 이상인지 확인
          const scoreText = await results
            .first()
            .locator('[data-testid="score-value"]')
            .textContent();
          if (scoreText) {
            const score = parseInt(scoreText.replace(/[^0-9]/g, ''));
            expect(score).toBeGreaterThanOrEqual(60);
          }
        }
      }
    });

    test('매칭 결과에서 관심목록 추가', async ({ page }) => {
      await page.goto('/customers');

      // 첫 번째 고객 선택
      await page.locator('[data-testid="customer-row"]').first().click();

      // 매칭 결과 탭 클릭
      await page.click('text=매칭 결과');

      // 매칭 결과가 있으면 관심목록 추가
      const results = page.locator('[data-testid="matching-result"]');
      const count = await results.count();

      if (count > 0) {
        // 첫 번째 결과의 별표 버튼 클릭
        await results
          .first()
          .getByRole('button', { name: /별표|star|관심/i })
          .click();

        // 성공 메시지 확인
        await expect(page.getByText(/추가되었습니다|added/i)).toBeVisible();

        // 별표가 채워진 상태로 변경 확인
        await expect(results.first().locator('[data-testid="star-filled"]')).toBeVisible();
      }
    });

    test('매칭 상세 정보 표시 (업종/지역/키워드 일치)', async ({ page }) => {
      await page.goto('/customers');

      // 첫 번째 고객 선택
      await page.locator('[data-testid="customer-row"]').first().click();

      // 매칭 결과 탭 클릭
      await page.click('text=매칭 결과');

      // 매칭 결과가 있으면 상세 정보 확인
      const results = page.locator('[data-testid="matching-result"]');
      const count = await results.count();

      if (count > 0) {
        // 매칭 상세 정보 (업종, 지역, 키워드 일치 표시)
        const firstResult = results.first();

        // 확장/상세보기 버튼이 있으면 클릭
        const detailButton = firstResult.getByRole('button', { name: /상세|자세히|expand/i });
        if (await detailButton.isVisible()) {
          await detailButton.click();
        }

        // 매칭 상세 정보 표시 확인
        await expect(firstResult.getByText(/업종|지역|키워드/i)).toBeVisible();
      }
    });
  });
});
