/**
 * @file html.ts
 * @description HTML 관련 유틸리티 함수
 * - HTML 엔티티 디코딩
 * - HTML 태그 제거
 * - 프로그램 설명 포맷팅
 */

/**
 * HTML 엔티티를 디코딩합니다.
 * 예: &amp; → &, &#xD;&#xA; → \n, &quot; → "
 *
 * @param text - 디코딩할 텍스트
 * @returns 디코딩된 텍스트
 *
 * @example
 * decodeHtmlEntities('&amp;#xD;&amp;#xA;') // '\n'
 * decodeHtmlEntities('&quot;Hello&quot;') // '"Hello"'
 */
export function decodeHtmlEntities(text: string): string {
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 정규식으로 처리
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#xD;&#xA;/g, '\n')
      .replace(/&#xD;/g, '\r')
      .replace(/&#xA;/g, '\n')
      .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(dec));
  }

  // 클라이언트 사이드에서는 textarea를 사용 (더 안전하고 완전함)
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * HTML 태그를 제거합니다.
 * 여러 공백을 하나로 합치고 양쪽 공백을 제거합니다.
 *
 * @param html - HTML 문자열
 * @returns 태그가 제거된 순수 텍스트
 *
 * @example
 * stripHtml('<p>Hello <strong>World</strong></p>') // 'Hello World'
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 프로그램 설명을 포맷팅합니다.
 * - \n 문자열을 실제 줄바꿈으로 변환
 * - 섹션 제목 강조 (예: "지원 대상:" → <strong>지원 대상</strong>)
 * - 서브섹션 강조 (예: "[신청방법]" → 파란색 강조)
 * - KOCCA 깨진 링크 수정
 * - URL을 자동으로 링크로 변환
 * - 이메일 주소 강조
 *
 * @param description - 원본 설명 텍스트
 * @returns 포맷팅된 HTML 문자열
 *
 * @example
 * formatDescription('지원 대상:\\n예비창업자') // '<strong>지원 대상</strong><br />예비창업자'
 */
export function formatDescription(description: string): string {
  let formatted = description;

  // 0. \n 문자열을 실제 줄바꿈으로 변환 (DB에 문자열로 저장된 경우)
  formatted = formatted.replace(/\\n/g, '\n');

  // 1. 섹션 제목 강조 및 뒤에 줄바꿈 추가
  formatted = formatted.replace(
    /(^|\n)([가-힣\s]{2,30}):/gm,
    '$1<strong class="block text-lg font-bold text-gray-900 mt-6 mb-1 pb-2 border-b border-gray-300">$2</strong>\n'
  );

  // 2. [서브섹션] 강조
  formatted = formatted.replace(
    /(\[[\w가-힣\s]+\])/g,
    '<span class="font-semibold text-[#0052CC]">$1</span>'
  );

  // 3. KOCCA 깨진 링크 수정
  // 패턴: (http://example.com" target="_blank" rel="noopener noreferrer" title="새창 열기">http://example.com)
  // → (<a href="http://example.com" target="_blank" rel="noopener noreferrer">http://example.com</a>)
  formatted = formatted.replace(
    /\((https?:\/\/[^\s"]+)" target="_blank"[^>]*>([^)]+)\)/g,
    '(<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#0052CC] hover:underline break-all">$2</a>)'
  );

  // 괄호 없는 경우도 처리
  formatted = formatted.replace(
    /(https?:\/\/[^\s"]+)" target="_blank"[^>]*>([^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#0052CC] hover:underline break-all">$2</a>'
  );

  // 4. 일반 URL을 링크로 변환 (아직 링크가 아닌 URL만)
  formatted = formatted.replace(
    /(?<!href=")(https?:\/\/[^\s<"]+)(?!")/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#0052CC] hover:underline break-all">$1</a>'
  );

  // 5. 이메일 주소 강조
  formatted = formatted.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '<span class="text-[#0052CC]">$1</span>'
  );

  return formatted;
}

/**
 * 텍스트를 지정된 길이로 자르고 말줄임표를 추가합니다.
 * HTML 엔티티 디코딩과 태그 제거를 포함합니다.
 *
 * @param text - 원본 텍스트
 * @param maxLength - 최대 길이 (기본값: 150)
 * @returns 잘린 텍스트
 *
 * @example
 * truncateText('<p>Very long text...</p>', 10) // 'Very long ...'
 */
export function truncateText(text: string, maxLength: number = 150): string {
  const decoded = decodeHtmlEntities(text);
  const plainText = stripHtml(decoded);
  return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}...` : plainText;
}
