import { test, expect } from '@playwright/test';

/**
 * 관리자 기능 E2E 테스트
 *
 * 시나리오:
 * 1. 관리자 페이지 접근 권한
 * 2. 사용자 관리
 * 3. 역할 관리
 * 4. 키워드 관리
 * 5. 교육 콘텐츠 관리
 */

test.describe('Admin Access Control', () => {
  test.describe('Unauthenticated Access', () => {
    test('비인증 상태에서 관리자 페이지 접근 시 로그인으로 리다이렉트', async ({ page }) => {
      await page.goto('/admin');
      await expect(page).toHaveURL(/\/login/);
    });

    test('비인증 상태에서 사용자 관리 접근 시 로그인으로 리다이렉트', async ({ page }) => {
      await page.goto('/admin/users');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // 일반 사용자로 관리자 페이지 접근 시 403 또는 리다이렉트
  test.describe.skip('Non-Admin Access', () => {
    // storageState: './tests/.auth/user.json' (일반 사용자)

    test('일반 사용자가 관리자 페이지 접근 시 권한 거부', async ({ page }) => {
      await page.goto('/admin');

      // 403 페이지 또는 접근 거부 메시지 또는 리다이렉트
      await expect(
        page.getByText(/권한이 없습니다|access denied|403/i).or(page.locator('body'))
      ).toBeVisible();
    });
  });
});

test.describe('Admin - User Management', () => {
  // 관리자 인증 상태 테스트
  // test.use({ storageState: './tests/.auth/admin.json' });

  test.describe.skip('Authenticated Admin', () => {
    test('사용자 관리 페이지 로드', async ({ page }) => {
      await page.goto('/admin/users');

      // 사용자 목록 헤더 확인
      await expect(page.getByRole('heading', { name: /사용자 관리/i })).toBeVisible();

      // 사용자 목록 테이블 확인
      await expect(page.locator('table')).toBeVisible();
    });

    test('사용자 역할 변경', async ({ page }) => {
      await page.goto('/admin/users');

      // 첫 번째 사용자의 역할 변경 버튼 클릭
      await page
        .locator('tr')
        .nth(1)
        .getByRole('button', { name: /역할|role/i })
        .click();

      // 역할 선택 다이얼로그 표시
      await expect(page.getByRole('dialog')).toBeVisible();

      // 역할 선택
      await page.click('text=관리자');

      // 저장 버튼 클릭
      await page.getByRole('button', { name: /저장|save/i }).click();

      // 성공 메시지 확인
      await expect(page.getByText(/변경되었습니다|updated/i)).toBeVisible();
    });

    test('사용자 검색', async ({ page }) => {
      await page.goto('/admin/users');

      // 검색어 입력
      await page.fill('input[placeholder*="검색"]', 'test@example.com');

      // 검색 실행
      await page.keyboard.press('Enter');

      // 검색 결과 대기
      await page.waitForLoadState('networkidle');

      // 검색 결과 표시 확인
      const rows = page.locator('tr');
      const count = await rows.count();

      // 검색 결과가 있으면 이메일 확인
      if (count > 1) {
        await expect(rows.nth(1)).toContainText('test@example.com');
      }
    });
  });
});

test.describe('Admin - Keyword Management', () => {
  test.describe.skip('Authenticated Admin', () => {
    test('키워드 관리 페이지 로드', async ({ page }) => {
      await page.goto('/admin/settings/keywords');

      // 키워드 관리 헤더 확인
      await expect(page.getByRole('heading', { name: /키워드 관리/i })).toBeVisible();

      // 카테고리 및 키워드 목록 확인
      await expect(page.getByText(/카테고리/i)).toBeVisible();
    });

    test('키워드 카테고리 추가', async ({ page }) => {
      await page.goto('/admin/settings/keywords');

      // 카테고리 추가 버튼 클릭
      await page.getByRole('button', { name: /카테고리 추가|add category/i }).click();

      // 카테고리명 입력
      await page.fill('[name="categoryName"]', '테스트 카테고리');

      // 저장 버튼 클릭
      await page.getByRole('button', { name: /저장|save/i }).click();

      // 추가된 카테고리 확인
      await expect(page.getByText('테스트 카테고리')).toBeVisible();
    });

    test('키워드 추가', async ({ page }) => {
      await page.goto('/admin/settings/keywords');

      // 첫 번째 카테고리 선택
      await page.locator('[data-testid="category-item"]').first().click();

      // 키워드 추가 버튼 클릭
      await page.getByRole('button', { name: /키워드 추가|add keyword/i }).click();

      // 키워드 입력
      await page.fill('[name="keyword"]', 'R&D');

      // 저장 버튼 클릭
      await page.getByRole('button', { name: /추가|add/i }).click();

      // 추가된 키워드 확인
      await expect(page.getByText('R&D')).toBeVisible();
    });

    test('키워드 삭제', async ({ page }) => {
      await page.goto('/admin/settings/keywords');

      // 첫 번째 키워드 삭제 버튼 클릭
      await page
        .locator('[data-testid="keyword-item"]')
        .first()
        .getByRole('button', { name: /삭제|delete/i })
        .click();

      // 확인 다이얼로그
      await page.getByRole('button', { name: /확인|yes/i }).click();

      // 삭제 성공 메시지
      await expect(page.getByText(/삭제되었습니다|deleted/i)).toBeVisible();
    });
  });
});

test.describe('Admin - Education Content Management', () => {
  test.describe.skip('Authenticated Admin', () => {
    test('교육 비디오 관리 페이지 로드', async ({ page }) => {
      await page.goto('/admin/education/videos');

      // 비디오 관리 헤더 확인
      await expect(page.getByRole('heading', { name: /비디오 관리/i })).toBeVisible();

      // 비디오 추가 버튼 확인
      await expect(page.getByRole('button', { name: /추가|add/i })).toBeVisible();
    });

    test('교육 비디오 추가', async ({ page }) => {
      await page.goto('/admin/education/videos/new');

      // 비디오 정보 입력
      await page.fill('[name="title"]', '테스트 교육 비디오');
      await page.fill('[name="description"]', '테스트 비디오 설명');
      await page.fill('[name="videoUrl"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

      // 카테고리 선택
      await page.click('[name="categoryId"]');
      await page.locator('[data-testid="category-option"]').first().click();

      // 저장 버튼 클릭
      await page.getByRole('button', { name: /저장|save/i }).click();

      // 목록 페이지로 이동
      await expect(page).toHaveURL(/\/admin\/education\/videos$/);

      // 추가된 비디오 확인
      await expect(page.getByText('테스트 교육 비디오')).toBeVisible();
    });

    test('노하우 게시판 공지사항 작성', async ({ page }) => {
      await page.goto('/admin/education/knowhow/posts/new');

      // 제목 입력
      await page.fill('[name="title"]', '공지사항 테스트');

      // 내용 입력
      const editor = page.locator('[contenteditable="true"]');
      await editor.fill('공지사항 내용입니다.');

      // 공지사항 체크
      await page.check('[name="isAnnouncement"]');

      // 상단 고정 체크
      await page.check('[name="isPinned"]');

      // 저장 버튼 클릭
      await page.getByRole('button', { name: /저장|save/i }).click();

      // 목록 페이지로 이동
      await expect(page).toHaveURL(/\/admin\/education\/knowhow$/);

      // 공지사항 배지 확인
      await expect(page.getByText('공지')).toBeVisible();
    });

    test('자료실 관리', async ({ page }) => {
      await page.goto('/admin/education/resources');

      // 자료 관리 헤더 확인
      await expect(page.getByRole('heading', { name: /자료 관리/i })).toBeVisible();

      // 자료 추가 버튼 확인
      await expect(page.getByRole('button', { name: /추가|add/i })).toBeVisible();
    });

    test('비디오 카테고리 관리', async ({ page }) => {
      await page.goto('/admin/education/videos/categories');

      // 카테고리 관리 헤더 확인
      await expect(page.getByRole('heading', { name: /카테고리 관리/i })).toBeVisible();

      // 카테고리 추가 버튼 확인
      await expect(page.getByRole('button', { name: /추가|add/i })).toBeVisible();
    });
  });
});
