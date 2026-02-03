/**
 * @file gyeonggi-tp-api-client.ts
 * @description 경기테크노파크 크롤링 API 클라이언트
 *
 * 경기테크노파크 사업공고 페이지에서 데이터를 크롤링하여 수집
 * URL: https://pms.gtp.or.kr/web/business/webBusinessList.do
 *
 * 특징:
 * - Form POST 방식으로 데이터 조회
 * - 경기도 31개 시군 필터링 지원
 * - 페이지네이션 지원 (10/30/50/100건)
 */

import type { IProgramAPIClient, RawProgramData, SyncParams } from './base-api-client';
import { withRetry } from '@/lib/utils/api-retry';
import { APIError, ErrorCode } from '@/lib/utils/error-handler';
import * as cheerio from 'cheerio';

/**
 * 경기도 지역 코드 매핑 (경기테크노파크 공식 bsAreaMap 기준)
 */
const GYEONGGI_REGION_CODES: Record<string, string> = {
  CD003004001: '서울',
  CD003004002: '인천',
  CD003004003: '가평군',
  CD003004004: '고양시',
  CD003004005: '과천시',
  CD003004006: '광명시',
  CD003004007: '광주시',
  CD003004008: '구리시',
  CD003004009: '군포시',
  CD003004010: '김포시',
  CD003004011: '남양주시',
  CD003004012: '동두천시',
  CD003004013: '부천시',
  CD003004014: '성남시',
  CD003004015: '수원시',
  CD003004016: '시흥시',
  CD003004017: '안산시',
  CD003004018: '안성시',
  CD003004019: '안양시',
  CD003004020: '양주시',
  CD003004021: '양평군',
  CD003004022: '여주시',
  CD003004023: '연천군',
  CD003004024: '오산시',
  CD003004025: '용인시',
  CD003004026: '의왕시',
  CD003004027: '의정부시',
  CD003004028: '이천시',
  CD003004029: '파주시',
  CD003004030: '평택시',
  CD003004031: '포천시',
  CD003004032: '하남시',
  CD003004033: '화성시',
  CD003004034: '기타',
};

/**
 * 경기테크노파크 프로그램 데이터 구조
 */
interface GyeonggiTPProgramData {
  id: string; // 고유 ID (URL에서 추출)
  title: string; // 공고명
  businessType: string; // 사업유형
  region: string; // 지역 (시군) - 코드가 아닌 실제 지역명
  regionCode: string; // 지역 코드 (원본)
  hostOrganization: string; // 주관기관
  applicationPeriod: string; // 신청기간
  sourceUrl: string; // 상세 페이지 URL
  registeredAt: Date; // 등록일 (신청 시작일 기준)
  deadline: Date | null; // 마감일
  [key: string]: unknown;
}

/**
 * 경기테크노파크 API 클라이언트
 *
 * Form POST 요청으로 사업공고 목록을 조회하고 HTML을 파싱하여 데이터 추출
 */
export class GyeonggiTPAPIClient implements IProgramAPIClient {
  private readonly baseUrl = 'https://pms.gtp.or.kr';
  private readonly listUrl = 'https://pms.gtp.or.kr/web/business/webBusinessList.do';

  /**
   * 데이터 소스 이름 반환
   */
  getDataSource(): string {
    return '경기테크노파크';
  }

  /**
   * 경기테크노파크에서 프로그램 목록 크롤링
   *
   * @param params - 페이지네이션 파라미터
   * @returns 원본 프로그램 데이터 배열
   */
  async fetchPrograms(params: SyncParams): Promise<RawProgramData[]> {
    console.log(`[GyeonggiTP] Fetching programs: page=${params.page}, pageSize=${params.pageSize}`);

    return withRetry(
      async () => {
        // Form 데이터 생성
        const formData = new URLSearchParams();
        formData.append('page', params.page.toString());
        formData.append('pageUnit', params.pageSize.toString());
        formData.append('schStrDiv', '1'); // 검색 구분
        formData.append('schSdt', ''); // 시작일 (빈 값 = 전체)
        formData.append('schEdt', ''); // 종료일 (빈 값 = 전체)
        formData.append('schBusinesscd', ''); // 사업분류 (빈 값 = 전체)
        formData.append('schAreacd', ''); // 지역코드 (빈 값 = 전체)

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
            `[GyeonggiTP] HTTP error: ${response.status} ${response.statusText}`,
            { statusCode: response.status },
            response.status
          );
        }

        const html = await response.text();
        const programs = this.parseHTML(html);

        console.log(`[GyeonggiTP] ✅ Fetched ${programs.length} programs`);

        return programs as RawProgramData[];
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, delay, error) => {
          console.warn(`[GyeonggiTP] ⚠️ Retry attempt ${attempt}, waiting ${delay}ms`, {
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
  private parseHTML(html: string): GyeonggiTPProgramData[] {
    const $ = cheerio.load(html);
    const programs: GyeonggiTPProgramData[] = [];

    // 테이블 행 순회 (헤더 제외)
    $('table tbody tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      if (cells.length < 6) return; // 데이터 행이 아님

      // 각 셀에서 데이터 추출
      const title = $(cells[1]).text().trim();
      const businessType = $(cells[2]).text().trim();
      const hostOrganization = $(cells[4]).text().trim();

      // 지역 코드 추출 (숨겨진 span에서)
      // <span id="bs_areacd" class="bs_areacd" style="display:none;">CD003004032</span>
      const regionCell = $(cells[3]);
      const regionCodeSpan = regionCell.find('span.bs_areacd').text().trim();
      const regionCode = regionCodeSpan || '';

      // 지역 코드를 실제 지역명으로 변환
      const region = this.convertRegionCodeToName(regionCode);

      // 신청기간 추출 (HTML 태그 제거 후)
      // 형식: "2026-02-02 09:00 <br>~ 2026-02-27 18:00"
      const periodCell = $(cells[5]);
      // <br> 태그를 공백으로 변환 후 텍스트 추출
      const applicationPeriodHtml = periodCell.html() || '';
      const applicationPeriod = applicationPeriodHtml
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // 링크에서 ID 추출
      // 형식: fn_goView('172161')
      const linkElement = $(cells[1]).find('a');
      const onclick = linkElement.attr('onclick') || '';
      const idMatch = onclick.match(/fn_goView\('(\d+)'\)/);
      const id = idMatch
        ? idMatch[1]
        : `gyeonggi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // 상세 페이지 URL 생성
      const sourceUrl = id ? `${this.baseUrl}/web/business/webBusinessView.do?idx=${id}` : '';

      // 신청기간 파싱 (형식: "2026-02-02 09:00 ~ 2026-02-27 18:00")
      const { startDate, endDate } = this.parseApplicationPeriod(applicationPeriod);

      if (title) {
        programs.push({
          id,
          title,
          businessType,
          region,
          regionCode,
          hostOrganization,
          applicationPeriod,
          sourceUrl,
          registeredAt: startDate || new Date(),
          deadline: endDate,
        });
      }
    });

    return programs;
  }

  /**
   * 지역 코드를 실제 지역명으로 변환
   *
   * @param regionCode - 지역 코드 (예: "CD003004032" 또는 "CD003004003,CD003004004,...")
   * @returns 지역명 문자열
   */
  private convertRegionCodeToName(regionCode: string): string {
    if (!regionCode) {
      return '경기';
    }

    // 여러 코드가 콤마로 구분된 경우
    const codes = regionCode.split(',').map(c => c.trim());

    // 코드가 많으면 (10개 이상) "경기도 전체"로 처리
    if (codes.length >= 10) {
      return '경기도 전체';
    }

    // 각 코드를 지역명으로 변환
    const regionNames = codes
      .map(code => GYEONGGI_REGION_CODES[code] || null)
      .filter((name): name is string => name !== null);

    // 중복 제거
    const uniqueNames = Array.from(new Set(regionNames));

    if (uniqueNames.length === 0) {
      return '경기';
    }

    // "경기도 전체"가 포함되어 있으면 그것만 반환
    if (uniqueNames.includes('경기도 전체')) {
      return '경기도 전체';
    }

    return uniqueNames.join(', ');
  }

  /**
   * 신청기간 문자열 파싱
   *
   * @param period - 신청기간 문자열 (예: "2026.01.01 ~ 2026.02.28")
   * @returns 시작일과 종료일
   */
  private parseApplicationPeriod(period: string): { startDate: Date | null; endDate: Date | null } {
    if (!period) {
      return { startDate: null, endDate: null };
    }

    const parts = period.split('~').map(s => s.trim());
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (parts.length >= 1 && parts[0]) {
      const parsed = this.parseKoreanDate(parts[0]);
      if (parsed) startDate = parsed;
    }

    if (parts.length >= 2 && parts[1]) {
      const parsed = this.parseKoreanDate(parts[1]);
      if (parsed) endDate = parsed;
    }

    return { startDate, endDate };
  }

  /**
   * 한국식 날짜 문자열 파싱
   *
   * @param dateStr - 날짜 문자열 (예: "2026.01.01", "2026-01-01", "2026-01-01 09:00")
   * @returns Date 객체 또는 null
   */
  private parseKoreanDate(dateStr: string): Date | null {
    // 날짜 부분만 추출 (시간 부분 제거)
    // "2026-02-02 09:00" -> "2026-02-02"
    const dateOnly = dateStr.split(' ')[0];
    const normalized = dateOnly.replace(/\./g, '-');
    const date = new Date(normalized);

    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  }

  /**
   * 키워드 추출
   */
  extractKeywords(raw: RawProgramData): string[] {
    const data = raw as GyeonggiTPProgramData;
    const keywords: string[] = [];

    // 사업유형 키워드
    if (data.businessType) {
      keywords.push(data.businessType);
    }

    // 제목에서 키워드 추출 (괄호 안 내용)
    if (data.title) {
      const bracketMatch = data.title.match(/\[([^\]]+)\]/g);
      if (bracketMatch) {
        bracketMatch.forEach(match => {
          keywords.push(match.replace(/[\[\]]/g, ''));
        });
      }
    }

    // 주관기관
    if (data.hostOrganization) {
      keywords.push(data.hostOrganization);
    }

    return Array.from(new Set(keywords)).slice(0, 15);
  }

  /**
   * 대상 지역 추출
   */
  parseLocation(raw: RawProgramData): string[] {
    const data = raw as GyeonggiTPProgramData;
    const locations: string[] = [];

    // 지역 필드 활용
    if (data.region) {
      locations.push(data.region);
    }

    // 기본값: 경기
    return locations.length > 0 ? locations : ['경기'];
  }

  /**
   * 대상 업종 추출
   */
  parseTargetAudience(raw: RawProgramData): string[] {
    const data = raw as GyeonggiTPProgramData;
    const audiences: string[] = [];

    // 사업유형에서 대상 추출
    if (data.businessType) {
      audiences.push(data.businessType);
    }

    return audiences.length > 0 ? audiences : ['전체'];
  }

  /**
   * 등록일 추출
   */
  parseRegisteredAt(raw: RawProgramData): Date {
    const data = raw as GyeonggiTPProgramData;

    if (data.registeredAt instanceof Date && !isNaN(data.registeredAt.getTime())) {
      return data.registeredAt;
    }

    return new Date();
  }

  /**
   * 공고 URL 추출
   */
  parseSourceUrl(raw: RawProgramData): string | null {
    const data = raw as GyeonggiTPProgramData;
    return data.sourceUrl || null;
  }

  /**
   * 시작일 추출
   */
  parseStartDate(raw: RawProgramData): Date | null {
    const data = raw as GyeonggiTPProgramData;

    if (data.registeredAt instanceof Date && !isNaN(data.registeredAt.getTime())) {
      return data.registeredAt;
    }

    return null;
  }

  /**
   * 마감일 추출
   */
  parseDeadline(raw: RawProgramData): Date | null {
    const data = raw as GyeonggiTPProgramData;

    if (data.deadline instanceof Date && !isNaN(data.deadline.getTime())) {
      return data.deadline;
    }

    return null;
  }

  /**
   * 첨부파일 URL 추출 (테크노파크는 첨부파일 URL 미제공)
   */
  parseAttachmentUrl(_raw: RawProgramData): string | null {
    return null;
  }
}
