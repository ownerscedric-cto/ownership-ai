import { test, expect } from '@playwright/test';

/**
 * 고객 관리 전체 흐름 E2E 테스트
 *
 * 시나리오:
 * 1. 로그인 상태에서 고객 목록 페이지 접근
 * 2. 새 고객 등록
 * 3. 고객 정보 조회
 * 4. 고객 정보 수정
 * 5. 고객 삭제
 */

test.describe('Customer Management Flow', () => {
  // 인증된 상태로 테스트 실행 (실제 테스트 시 활성화)
  // test.use({ storageState: './tests/.auth/user.json' });

  test.describe('Unauthenticated Access', () => {
    test('비인증 상태에서 고객 페이지 접근 시 로그인으로 리다이렉트', async ({ page }) => {
      await page.goto('/customers');
      await expect(page).toHaveURL(/\/login/);
    });

    test('비인증 상태에서 고객 등록 페이지 접근 시 로그인으로 리다이렉트', async ({ page }) => {
      await page.goto('/customers/new');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // 인증 상태 테스트는 storageState 설정 후 활성화
  test.describe.skip('Authenticated - Customer CRUD', () => {
    test('고객 목록 페이지가 정상적으로 로드되어야 함', async ({ page }) => {
      await page.goto('/customers');

      // 고객 목록 헤더 확인
      await expect(page.getByRole('heading', { name: /고객|customer/i })).toBeVisible();

      // 고객 추가 버튼 확인
      await expect(page.getByRole('button', { name: /추가|새 고객|add/i })).toBeVisible();
    });

    test('새 고객 등록 플로우', async ({ page }) => {
      await page.goto('/customers/new');

      // 고객 등록 폼 확인
      await expect(page.getByRole('heading', { name: /고객 등록|새 고객/i })).toBeVisible();

      // 필수 필드 입력
      await page.fill('input[name="companyName"]', '테스트 회사');
      await page.fill('input[name="representativeName"]', '홍길동');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="phone"]', '010-1234-5678');

      // 업종 선택
      await page.click('[name="industry"]');
      await page.click('text=제조업');

      // 지역 선택
      await page.click('[name="location"]');
      await page.click('text=서울');

      // 등록 버튼 클릭
      await page.getByRole('button', { name: /등록|저장|submit/i }).click();

      // 성공 후 고객 목록으로 이동
      await expect(page).toHaveURL(/\/customers/);

      // 등록된 고객 확인
      await expect(page.getByText('테스트 회사')).toBeVisible();
    });

    test('고객 상세 정보 조회', async ({ page }) => {
      await page.goto('/customers');

      // 첫 번째 고객 클릭
      await page.locator('[data-testid="customer-row"]').first().click();

      // 고객 상세 패널 확인
      await expect(page.getByText(/기본정보|사업자 정보/i)).toBeVisible();
      await expect(page.getByText(/니즈 정보|요구사항/i)).toBeVisible();
    });

    test('고객 정보 수정', async ({ page }) => {
      await page.goto('/customers');

      // 첫 번째 고객 선택
      await page.locator('[data-testid="customer-row"]').first().click();

      // 수정 버튼 클릭
      await page.getByRole('button', { name: /수정|edit/i }).click();

      // 회사명 수정
      await page.fill('input[name="companyName"]', '수정된 회사명');

      // 저장 버튼 클릭
      await page.getByRole('button', { name: /저장|save/i }).click();

      // 수정된 내용 확인
      await expect(page.getByText('수정된 회사명')).toBeVisible();
    });

    test('고객 삭제', async ({ page }) => {
      await page.goto('/customers');

      // 첫 번째 고객 선택
      await page.locator('[data-testid="customer-row"]').first().click();

      // 삭제 버튼 클릭
      await page.getByRole('button', { name: /삭제|delete/i }).click();

      // 확인 다이얼로그에서 확인 클릭
      await page.getByRole('button', { name: /확인|예|yes/i }).click();

      // 삭제 성공 토스트 또는 목록 업데이트 확인
      await expect(page.getByText(/삭제되었습니다|deleted/i)).toBeVisible();
    });
  });
});

test.describe('Customer Bulk Upload', () => {
  test('비인증 상태에서 대량 업로드 페이지 접근 시 로그인으로 리다이렉트', async ({ page }) => {
    await page.goto('/customers/bulk-upload');
    await expect(page).toHaveURL(/\/login/);
  });

  // 인증 상태 테스트
  test.describe.skip('Authenticated - Bulk Upload', () => {
    test('대량 업로드 페이지 접근', async ({ page }) => {
      await page.goto('/customers/bulk-upload');

      // 업로드 영역 확인
      await expect(page.getByText(/파일 업로드|엑셀 업로드/i)).toBeVisible();

      // 템플릿 다운로드 버튼 확인
      await expect(page.getByRole('button', { name: /템플릿|template/i })).toBeVisible();
    });
  });
});
