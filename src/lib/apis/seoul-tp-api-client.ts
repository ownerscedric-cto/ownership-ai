/**
 * @file seoul-tp-api-client.ts
 * @description 서울테크노파크 크롤링 API 클라이언트
 *
 * 서울테크노파크 기업지원공고 페이지에서 데이터를 크롤링하여 수집
 * URL: https://www.seoultp.or.kr/user/nd19746.do
 *
 * 특징:
 * - 테이블 기반 게시판
 * - JavaScript 기반 페이지네이션 (POST 요청으로 처리)
 * - 날짜 형식: YYYY.MM.DD
 */

import type { IProgramAPIClient, RawProgramData, SyncParams } from './base-api-client';
import { withRetry } from '@/lib/utils/api-retry';
import { APIError, ErrorCode } from '@/lib/utils/error-handler';
import * as cheerio from 'cheerio';

/**
 * 상세 페이지 첨부파일 정보
 */
interface SeoulTPAttachment {
  fileName: string; // 파일명 (예: "공고문.pdf")
  downloadUrl: string; // 다운로드 URL
}

/**
 * 상세 페이지 크롤링 결과
 */
export interface SeoulTPDetailData {
  contentImages: string[]; // 본문 이미지 URL 목록
  attachments: SeoulTPAttachment[]; // 첨부파일 목록
  textContent: string; // 본문 텍스트 (이미지 제외)
}

/**
 * 서울테크노파크 프로그램 데이터 구조
 */
interface SeoulTPProgramData {
  id: string; // 고유 ID (nttId)
  title: string; // 공고명
  author: string; // 작성자
  registeredAt: Date; // 등록일
  viewCount: number; // 조회수
  sourceUrl: string; // 상세 페이지 URL
  category?: string; // 카테고리 (있는 경우)
  contentImages?: string[]; // 상세 페이지 본문 이미지 URL
  attachments?: SeoulTPAttachment[]; // 상세 페이지 첨부파일
  textContent?: string; // 상세 페이지 본문 텍스트
  [key: string]: unknown;
}

/**
 * 서울테크노파크 API 클라이언트
 *
 * POST 요청으로 게시판 목록을 조회하고 HTML을 파싱하여 데이터 추출
 */
export class SeoulTPAPIClient implements IProgramAPIClient {
  private readonly baseUrl = 'https://www.seoultp.or.kr';
  private readonly listUrl = 'https://www.seoultp.or.kr/user/nd19746.do';

  /**
   * 데이터 소스 이름 반환
   */
  getDataSource(): string {
    return '서울테크노파크';
  }

  /**
   * 서울테크노파크에서 프로그램 목록 크롤링
   *
   * @param params - 페이지네이션 파라미터
   * @returns 원본 프로그램 데이터 배열
   */
  async fetchPrograms(params: SyncParams): Promise<RawProgramData[]> {
    console.log(`[SeoulTP] Fetching programs: page=${params.page}, pageSize=${params.pageSize}`);

    return withRetry(
      async () => {
        // Form 데이터 생성
        const formData = new URLSearchParams();
        formData.append('page', params.page.toString());
        formData.append('pagingAt', 'Y');
        formData.append('listSize', params.pageSize.toString());
        formData.append('menuContentId', '19746');
        formData.append('insInsttCode', 'seoul'); // 기관 코드

        // POST 요청
        const response = await fetch(this.listUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            Referer: this.listUrl,
          },
          body: formData.toString(),
        });

        if (!response.ok) {
          throw new APIError(
            ErrorCode.EXTERNAL_API_ERROR,
            `[SeoulTP] HTTP error: ${response.status} ${response.statusText}`,
            { statusCode: response.status },
            response.status
          );
        }

        const html = await response.text();
        const programs = this.parseHTML(html);

        console.log(`[SeoulTP] ✅ Fetched ${programs.length} programs`);

        return programs as RawProgramData[];
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, delay, error) => {
          console.warn(`[SeoulTP] ⚠️ Retry attempt ${attempt}, waiting ${delay}ms`, {
            error: error.message,
          });
        },
      }
    );
  }

  /**
   * HTML 파싱하여 프로그램 목록 추출
   *
   * @param html - 페이지 HTML
   * @returns 프로그램 데이터 배열
   */
  private parseHTML(html: string): SeoulTPProgramData[] {
    const $ = cheerio.load(html);
    const programs: SeoulTPProgramData[] = [];

    // 테이블 행 순회
    $('table tbody tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      if (cells.length < 5) return; // 데이터 행이 아님

      // 각 셀에서 데이터 추출
      // 일반적인 구조: 번호, 제목, 작성자, 등록일, 조회수
      const title = $(cells[1]).find('a').text().trim() || $(cells[1]).text().trim();
      const author = $(cells[2]).text().trim();
      const dateStr = $(cells[3]).text().trim();
      const viewCount = parseInt($(cells[4]).text().trim(), 10) || 0;

      // 링크에서 ID 추출
      const linkElement = $(cells[1]).find('a');
      const href = linkElement.attr('href') || '';

      // href에서 nttId 추출
      // 형식: goBoardView('/user/nd19746.do','View','00003938')
      let id = '';
      const goBoardViewMatch = href.match(/goBoardView\([^,]+,\s*[^,]+,\s*'([^']+)'\)/);
      const nttIdMatch = href.match(/nttId=([^&]+)/);

      if (goBoardViewMatch) {
        id = goBoardViewMatch[1];
      } else if (nttIdMatch) {
        id = nttIdMatch[1];
      } else {
        id = `seoul-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      }

      // 상세 페이지 URL 생성
      // 실제 동작하는 URL 형식: ?View&boardNo=00003981&menuCode=www
      const sourceUrl = id ? `${this.baseUrl}/user/nd19746.do?View&boardNo=${id}&menuCode=www` : '';

      // 날짜 파싱
      const registeredAt = this.parseDate(dateStr);

      if (title && title !== '제목') {
        programs.push({
          id,
          title,
          author,
          registeredAt,
          viewCount,
          sourceUrl,
        });
      }
    });

    return programs;
  }

  /**
   * 날짜 문자열 파싱
   *
   * @param dateStr - 날짜 문자열 (예: "2026.01.29")
   * @returns Date 객체
   */
  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();

    // YYYY.MM.DD 형식
    const normalized = dateStr.replace(/\./g, '-');
    const date = new Date(normalized);

    if (!isNaN(date.getTime())) {
      return date;
    }

    return new Date();
  }

  /**
   * 키워드 추출
   */
  extractKeywords(raw: RawProgramData): string[] {
    const data = raw as SeoulTPProgramData;
    const keywords: string[] = [];

    // 제목에서 키워드 추출 (괄호 안 내용)
    if (data.title) {
      const bracketMatch = data.title.match(/\[([^\]]+)\]/g);
      if (bracketMatch) {
        bracketMatch.forEach(match => {
          keywords.push(match.replace(/[\[\]]/g, ''));
        });
      }

      // 주요 키워드 추출
      const keywordPatterns = [
        '창업',
        '기술',
        'R&D',
        '수출',
        '마케팅',
        '컨설팅',
        '입주',
        '지원',
        '교육',
        '훈련',
        'ESG',
        '디지털',
      ];
      keywordPatterns.forEach(keyword => {
        if (data.title.includes(keyword)) {
          keywords.push(keyword);
        }
      });
    }

    // 카테고리
    if (data.category) {
      keywords.push(data.category);
    }

    return Array.from(new Set(keywords)).slice(0, 15);
  }

  /**
   * 대상 지역 추출
   */
  parseLocation(_raw: RawProgramData): string[] {
    // 서울테크노파크는 서울 지역 전담
    return ['서울'];
  }

  /**
   * 대상 업종 추출
   */
  parseTargetAudience(raw: RawProgramData): string[] {
    const data = raw as SeoulTPProgramData;
    const audiences: string[] = [];

    // 제목에서 대상 추출
    if (data.title) {
      const targetPatterns = ['중소기업', '스타트업', '벤처', '소상공인', '예비창업자'];
      targetPatterns.forEach(target => {
        if (data.title.includes(target)) {
          audiences.push(target);
        }
      });
    }

    return audiences.length > 0 ? audiences : ['전체'];
  }

  /**
   * 등록일 추출
   */
  parseRegisteredAt(raw: RawProgramData): Date {
    const data = raw as SeoulTPProgramData;

    if (data.registeredAt instanceof Date && !isNaN(data.registeredAt.getTime())) {
      return data.registeredAt;
    }

    return new Date();
  }

  /**
   * 공고 URL 추출
   */
  parseSourceUrl(raw: RawProgramData): string | null {
    const data = raw as SeoulTPProgramData;
    return data.sourceUrl || null;
  }

  /**
   * 상세 페이지 크롤링하여 본문 이미지, 첨부파일, 텍스트 추출
   *
   * @param boardNo - 게시물 번호 (예: "00003981")
   * @returns 상세 페이지 데이터
   */
  async fetchProgramDetail(boardNo: string): Promise<SeoulTPDetailData> {
    const detailUrl = `${this.baseUrl}/user/nd19746.do?View&boardNo=${boardNo}&menuCode=www`;

    return withRetry(
      async () => {
        const response = await fetch(detailUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            Referer: this.listUrl,
          },
        });

        if (!response.ok) {
          throw new APIError(
            ErrorCode.EXTERNAL_API_ERROR,
            `[SeoulTP] Detail page HTTP error: ${response.status}`,
            { statusCode: response.status, boardNo },
            response.status
          );
        }

        const html = await response.text();
        return this.parseDetailHTML(html);
      },
      {
        maxRetries: 2,
        baseDelay: 500,
        onRetry: (attempt, delay, error) => {
          console.warn(`[SeoulTP] Detail page retry ${attempt} for boardNo=${boardNo}`, {
            error: error.message,
          });
        },
      }
    );
  }

  /**
   * 상세 페이지 HTML 파싱
   *
   * 서울테크노파크 상세 페이지 구조:
   * - 본문은 대부분 이미지로 구성 (/common/attachfile/attachfileView.do?attachNo=XXXXX)
   * - 첨부파일은 #attachdown 링크로 표시 (파일명만 표시)
   * - 사이트 공통 이미지 (/resource/image/) 제외
   */
  private parseDetailHTML(html: string): SeoulTPDetailData {
    const $ = cheerio.load(html);
    const contentImages: string[] = [];
    const attachments: SeoulTPAttachment[] = [];
    let textContent = '';

    // 본문 콘텐츠 이미지 추출 (attachfile 경로만)
    $('img').each((_, img) => {
      const src = $(img).attr('src') || '';
      // 본문 이미지만 추출 (사이트 공통 리소스 제외)
      if (src.includes('/common/attachfile/attachfileView.do')) {
        const fullUrl = src.startsWith('http') ? src : `${this.baseUrl}${src}`;
        contentImages.push(fullUrl);
      }
    });

    // 첨부파일 추출 (#attachdown 링크 + onclick에서 attachNo 추출)
    $('a[href="#attachdown"]').each((_, link) => {
      const $link = $(link);
      const fileName = $link.text().trim();
      const onclick = $link.attr('onclick') || '';

      // onclick="attachfileDownload('/common/attachfile/attachfileDownload.do','00006914')"
      const attachNoMatch = onclick.match(/attachfileDownload\([^,]*,\s*'([^']+)'\)/);
      const attachNo = attachNoMatch ? attachNoMatch[1] : '';

      if (fileName) {
        attachments.push({
          fileName,
          downloadUrl: attachNo
            ? `${this.baseUrl}/common/attachfile/attachfileDownload.do?attachNo=${attachNo}`
            : '',
        });
      }
    });

    // 본문 텍스트 추출 (테이블 내 텍스트, 이미지/메타 제외)
    // 상세 내용이 있는 td 셀 찾기 (colspan이 있는 본문 셀)
    $('table td[colspan]').each((_, td) => {
      const $td = $(td);
      // 스크립트/스타일/이미지 제거
      const $clone = $td.clone();
      $clone.find('img, script, style').remove();

      // HTML 구조를 텍스트로 변환하면서 줄바꿈 보존
      // <br>, <p>, <div>, <li>, <tr> 등의 태그 경계를 줄바꿈으로 변환
      let html = $clone.html() || '';
      html = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<[^>]*>/g, '') // 나머지 태그 제거
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'");

      // 탭/연속 공백 정리 (줄바꿈은 보존)
      const text = html
        .replace(/\t/g, ' ')
        .replace(/ {2,}/g, ' ')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
        .replace(/\n{3,}/g, '\n\n') // 3개 이상 연속 줄바꿈 → 2개로
        .trim();

      // 의미있는 텍스트만 추가 (메타 정보 제외)
      if (text && text.length > 20 && !text.includes('기업지원공고게시물을 상세히')) {
        textContent += text + '\n';
      }
    });

    return {
      contentImages,
      attachments,
      textContent: textContent.trim(),
    };
  }

  /**
   * 시작일 추출 (서울테크노파크는 별도 시작일 정보 없음)
   */
  parseStartDate(_raw: RawProgramData): Date | null {
    return null;
  }

  /**
   * 마감일 추출 (서울테크노파크는 목록에서 마감일 정보 없음)
   */
  parseDeadline(_raw: RawProgramData): Date | null {
    return null;
  }

  /**
   * 첨부파일 URL 추출 (테크노파크는 첨부파일 URL 미제공)
   */
  parseAttachmentUrl(_raw: RawProgramData): string | null {
    return null;
  }
}
