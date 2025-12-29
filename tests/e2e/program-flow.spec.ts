import { test, expect } from '@playwright/test';

/**
 * 정부지원사업 프로그램 E2E 테스트
 *
 * 시나리오:
 * 1. 프로그램 목록 조회
 * 2. 프로그램 필터링 (데이터소스, 진행중 공고)
 * 3. 프로그램 검색
 * 4. 프로그램 상세 조회
 * 5. 관심목록 추가/제거
 */

test.describe('Program List', () => {
  test.describe('Unauthenticated Access', () => {
    test('비인증 상태에서 프로그램 목록 접근 시 로그인으로 리다이렉트', async ({ page }) => {
      await page.goto('/programs');
      await expect(page).toHaveURL(/\/login/);
    });

    test('비인증 상태에서 프로그램 상세 접근 시 로그인으로 리다이렉트', async ({ page }) => {
      await page.goto('/programs/some-id');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // 인증 상태 테스트
  test.describe.skip('Authenticated - Program Browse', () => {
    test('프로그램 목록 페이지가 정상적으로 로드되어야 함', async ({ page }) => {
      await page.goto('/programs');

      // 프로그램 목록 헤더 확인
      await expect(page.getByRole('heading', { name: /정부지원사업|프로그램/i })).toBeVisible();

      // 필터 영역 확인
      await expect(page.getByText(/데이터 소스|출처/i)).toBeVisible();

      // 진행중인 공고만 보기 체크박스 확인
      await expect(page.getByLabel(/진행중인 공고만|active only/i)).toBeVisible();
    });

    test('데이터소스 필터링', async ({ page }) => {
      await page.goto('/programs');

      // 기업마당 필터 선택
      await page.click('text=기업마당');

      // URL에 필터 파라미터 반영 확인
      await expect(page).toHaveURL(/dataSource=MSME/);

      // 필터링된 결과 확인
      const cards = page.locator('[data-testid="program-card"]');
      const count = await cards.count();

      // 카드가 있으면 모두 기업마당 배지를 가져야 함
      if (count > 0) {
        await expect(cards.first().getByText('기업마당')).toBeVisible();
      }
    });

    test('진행중인 공고만 보기 필터', async ({ page }) => {
      await page.goto('/programs');

      // 체크박스가 기본적으로 체크되어 있어야 함
      const checkbox = page.getByLabel(/진행중인 공고만/i);
      await expect(checkbox).toBeChecked();

      // 체크 해제
      await checkbox.uncheck();

      // URL에 파라미터 반영
      await expect(page).toHaveURL(/showActiveOnly=false/);
    });

    test('프로그램 검색', async ({ page }) => {
      await page.goto('/programs');

      // 검색어 입력
      await page.fill('input[placeholder*="검색"]', 'R&D');

      // 검색 실행 (Enter 또는 버튼)
      await page.keyboard.press('Enter');

      // 검색 결과 로딩 대기
      await page.waitForLoadState('networkidle');

      // 결과에 검색어 포함 확인
      const results = page.locator('[data-testid="program-card"]');
      const count = await results.count();

      if (count > 0) {
        // 첫 번째 결과에 검색어 포함 여부 확인
        const firstCard = results.first();
        await expect(firstCard).toContainText(/R&D/i);
      }
    });

    test('프로그램 상세 페이지 이동', async ({ page }) => {
      await page.goto('/programs');

      // 첫 번째 프로그램 카드 클릭
      await page.locator('[data-testid="program-card"]').first().click();

      // 상세 페이지로 이동 확인
      await expect(page).toHaveURL(/\/programs\/[a-z0-9-]+/);

      // 상세 정보 표시 확인
      await expect(page.getByText(/지원대상|신청기간|지원내용/i)).toBeVisible();
    });

    test('프로그램 상세 페이지 정보 표시', async ({ page }) => {
      await page.goto('/programs');

      // 첫 번째 프로그램 클릭
      await page.locator('[data-testid="program-card"]').first().click();

      // 필수 정보 표시 확인
      await expect(page.getByText(/지원대상/i)).toBeVisible();
      await expect(page.getByText(/신청기간|접수기간/i)).toBeVisible();
      await expect(page.getByText(/지원내용|지원규모/i)).toBeVisible();

      // 원문 링크 버튼 확인
      await expect(page.getByRole('link', { name: /원문 보기|상세보기/i })).toBeVisible();
    });
  });
});

test.describe('Program Watchlist', () => {
  // 인증 상태 테스트
  test.describe.skip('Authenticated - Watchlist', () => {
    test('프로그램 관심목록 추가', async ({ page }) => {
      await page.goto('/programs');

      // 첫 번째 프로그램의 관심목록 버튼 클릭
      const firstCard = page.locator('[data-testid="program-card"]').first();
      await firstCard.getByRole('button', { name: /관심목록|별표|star/i }).click();

      // 고객 선택 다이얼로그 표시
      await expect(page.getByRole('dialog')).toBeVisible();

      // 고객 선택
      await page.locator('[data-testid="customer-option"]').first().click();

      // 추가 버튼 클릭
      await page.getByRole('button', { name: /추가|add/i }).click();

      // 성공 메시지 확인
      await expect(page.getByText(/추가되었습니다|added/i)).toBeVisible();
    });

    test('고객 페이지에서 관심목록 확인', async ({ page }) => {
      await page.goto('/customers');

      // 첫 번째 고객 선택
      await page.locator('[data-testid="customer-row"]').first().click();

      // 매칭 결과 탭 클릭
      await page.click('text=매칭 결과');

      // 관심목록 탭 클릭
      await page.click('text=관심목록');

      // 관심목록 프로그램 카드 표시 확인
      await expect(page.locator('[data-testid="watchlist-card"]')).toBeVisible();
    });

    test('관심목록에서 프로그램 제거', async ({ page }) => {
      await page.goto('/customers');

      // 첫 번째 고객 선택
      await page.locator('[data-testid="customer-row"]').first().click();

      // 매칭 결과 탭 → 관심목록 탭
      await page.click('text=매칭 결과');
      await page.click('text=관심목록');

      // 첫 번째 관심목록 항목의 삭제 버튼 클릭
      await page
        .locator('[data-testid="watchlist-card"]')
        .first()
        .getByRole('button', { name: /삭제|제거|remove/i })
        .click();

      // 확인 다이얼로그
      await page.getByRole('button', { name: /확인|예/i }).click();

      // 제거 성공 메시지
      await expect(page.getByText(/제거되었습니다|removed/i)).toBeVisible();
    });
  });
});
