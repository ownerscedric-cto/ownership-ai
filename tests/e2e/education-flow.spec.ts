import { test, expect } from '@playwright/test';

/**
 * 교육센터 E2E 테스트
 *
 * 시나리오:
 * 1. 교육 비디오 목록 및 시청
 * 2. 노하우 게시판 조회 및 작성
 * 3. 자료실 다운로드
 * 4. 댓글 작성
 */

test.describe('Education Center', () => {
  test.describe('Unauthenticated Access', () => {
    test('비인증 상태에서 교육센터 접근 시 로그인으로 리다이렉트', async ({ page }) => {
      await page.goto('/education');
      await expect(page).toHaveURL(/\/login/);
    });

    test('비인증 상태에서 비디오 목록 접근 시 로그인으로 리다이렉트', async ({ page }) => {
      await page.goto('/education/videos');
      await expect(page).toHaveURL(/\/login/);
    });

    test('비인증 상태에서 노하우 게시판 접근 시 로그인으로 리다이렉트', async ({ page }) => {
      await page.goto('/education/knowhow/posts');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // 인증 상태 테스트
  test.describe.skip('Authenticated - Video Content', () => {
    test('비디오 목록 페이지 로드', async ({ page }) => {
      await page.goto('/education/videos');

      // 비디오 목록 헤더 확인
      await expect(page.getByRole('heading', { name: /교육 비디오|영상/i })).toBeVisible();

      // 카테고리 필터 확인
      await expect(page.getByText(/카테고리/i)).toBeVisible();
    });

    test('비디오 카테고리 필터링', async ({ page }) => {
      await page.goto('/education/videos');

      // 카테고리 선택
      await page.click('text=정부지원사업 개요');

      // 필터링된 결과 확인
      await page.waitForLoadState('networkidle');

      const videos = page.locator('[data-testid="video-card"]');
      const count = await videos.count();

      // 결과가 있으면 카테고리 확인
      if (count > 0) {
        await expect(videos.first().getByText('정부지원사업 개요')).toBeVisible();
      }
    });

    test('비디오 상세 페이지 및 플레이어', async ({ page }) => {
      await page.goto('/education/videos');

      // 첫 번째 비디오 클릭
      await page.locator('[data-testid="video-card"]').first().click();

      // 상세 페이지 이동 확인
      await expect(page).toHaveURL(/\/education\/videos\/[a-z0-9-]+/);

      // 비디오 플레이어 확인
      await expect(page.locator('iframe').or(page.locator('video'))).toBeVisible();

      // 비디오 정보 표시 확인
      await expect(page.getByText(/조회수|재생시간/i)).toBeVisible();
    });

    test('비디오 조회수 증가', async ({ page }) => {
      await page.goto('/education/videos');

      // 첫 번째 비디오 클릭
      await page.locator('[data-testid="video-card"]').first().click();

      // 페이지 로드 대기
      await page.waitForLoadState('networkidle');

      // 조회수 표시 확인 (조회수가 증가했음을 직접 확인하기 어려우므로 표시 여부만 확인)
      await expect(page.getByText(/조회수/i)).toBeVisible();
    });
  });

  // 노하우 게시판 테스트
  test.describe.skip('Authenticated - Knowhow Board', () => {
    test('노하우 게시판 목록 로드', async ({ page }) => {
      await page.goto('/education/knowhow/posts');

      // 게시판 헤더 확인
      await expect(page.getByRole('heading', { name: /노하우|커뮤니티/i })).toBeVisible();

      // 글쓰기 버튼 확인
      await expect(page.getByRole('button', { name: /글쓰기|작성/i })).toBeVisible();
    });

    test('노하우 게시글 작성', async ({ page }) => {
      await page.goto('/education/knowhow/posts/new');

      // 작성 폼 확인
      await expect(page.getByLabel(/제목/i)).toBeVisible();
      await expect(
        page.getByLabel(/내용/i).or(page.locator('[contenteditable="true"]'))
      ).toBeVisible();

      // 카테고리 선택
      await page.click('[name="categoryId"]');
      await page.locator('[data-testid="category-option"]').first().click();

      // 제목 입력
      await page.fill('[name="title"]', '테스트 노하우 게시글');

      // 내용 입력 (TipTap 에디터)
      const editor = page.locator('[contenteditable="true"]');
      await editor.fill('이것은 테스트 게시글 내용입니다.');

      // 작성 버튼 클릭
      await page.getByRole('button', { name: /작성|등록|submit/i }).click();

      // 성공 후 목록 또는 상세 페이지로 이동
      await expect(page).toHaveURL(/\/education\/knowhow\/posts/);
    });

    test('노하우 게시글 상세 조회', async ({ page }) => {
      await page.goto('/education/knowhow/posts');

      // 첫 번째 게시글 클릭
      await page.locator('[data-testid="post-row"]').first().click();

      // 상세 페이지 이동
      await expect(page).toHaveURL(/\/education\/knowhow\/posts\/[a-z0-9-]+/);

      // 게시글 내용 표시 확인
      await expect(page.getByText(/작성자|작성일/i)).toBeVisible();

      // 댓글 영역 확인
      await expect(page.getByText(/댓글/i)).toBeVisible();
    });

    test('댓글 작성', async ({ page }) => {
      await page.goto('/education/knowhow/posts');

      // 첫 번째 게시글 클릭
      await page.locator('[data-testid="post-row"]').first().click();

      // 댓글 입력
      await page.fill('[name="comment"]', '테스트 댓글입니다.');

      // 댓글 작성 버튼 클릭
      await page.getByRole('button', { name: /댓글 작성|등록/i }).click();

      // 댓글 표시 확인
      await expect(page.getByText('테스트 댓글입니다.')).toBeVisible();
    });

    test('게시글 수정 (작성자)', async ({ page }) => {
      await page.goto('/education/knowhow/posts');

      // 내 게시글 클릭 (작성자 본인의 게시글)
      await page.locator('[data-testid="post-row"]').first().click();

      // 수정 버튼 클릭
      await page.getByRole('button', { name: /수정|edit/i }).click();

      // 수정 페이지 이동
      await expect(page).toHaveURL(/\/edit/);

      // 제목 수정
      await page.fill('[name="title"]', '수정된 게시글 제목');

      // 저장 버튼 클릭
      await page.getByRole('button', { name: /저장|수정/i }).click();

      // 수정된 내용 확인
      await expect(page.getByText('수정된 게시글 제목')).toBeVisible();
    });
  });

  // 자료실 테스트
  test.describe.skip('Authenticated - Resources', () => {
    test('자료실 목록 로드', async ({ page }) => {
      await page.goto('/education/resources');

      // 자료실 헤더 확인
      await expect(page.getByRole('heading', { name: /자료실/i })).toBeVisible();

      // 타입 필터 확인
      await expect(page.getByText(/템플릿|체크리스트|문서/i)).toBeVisible();
    });

    test('자료 다운로드', async ({ page }) => {
      await page.goto('/education/resources');

      // 첫 번째 자료의 다운로드 버튼 클릭
      const downloadPromise = page.waitForEvent('download');
      await page
        .locator('[data-testid="resource-card"]')
        .first()
        .getByRole('button', { name: /다운로드|download/i })
        .click();

      // 다운로드 시작 확인
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBeTruthy();
    });

    test('자료 타입 필터링', async ({ page }) => {
      await page.goto('/education/resources');

      // 템플릿 필터 선택
      await page.click('text=템플릿');

      // 필터링된 결과 확인
      await page.waitForLoadState('networkidle');

      const resources = page.locator('[data-testid="resource-card"]');
      const count = await resources.count();

      // 결과가 있으면 타입 확인
      if (count > 0) {
        await expect(resources.first().getByText('템플릿')).toBeVisible();
      }
    });
  });
});
