/**
 * 쿠키 유틸리티 함수
 * - 조회수 중복 방지용 쿠키 관리
 */

/**
 * 쿠키 값 가져오기
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }

  return null;
}

/**
 * 쿠키 설정
 */
export function setCookie(name: string, value: string, days: number = 1): void {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

/**
 * 조회한 콘텐츠 ID 목록 가져오기
 */
export function getViewedContentIds(cookieName: string): string[] {
  const cookieValue = getCookie(cookieName);
  if (!cookieValue) return [];

  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch {
    return [];
  }
}

/**
 * 조회한 콘텐츠 ID 추가
 */
export function addViewedContentId(cookieName: string, contentId: string, days: number = 1): void {
  const viewedIds = getViewedContentIds(cookieName);

  if (!viewedIds.includes(contentId)) {
    viewedIds.push(contentId);
    setCookie(cookieName, encodeURIComponent(JSON.stringify(viewedIds)), days);
  }
}

/**
 * 이미 조회한 콘텐츠인지 확인
 */
export function hasViewedContent(cookieName: string, contentId: string): boolean {
  const viewedIds = getViewedContentIds(cookieName);
  return viewedIds.includes(contentId);
}
