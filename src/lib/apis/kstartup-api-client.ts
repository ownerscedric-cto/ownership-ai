/**
 * @file kstartup-api-client.ts
 * @description K-Startup API 클라이언트 (한국벤처창업진흥원)
 * Phase 3: 다중 API 통합 연동
 */

import { XMLParser } from 'fast-xml-parser';
import type { IProgramAPIClient, RawProgramData, SyncParams } from './base-api-client';
import { withRetry } from '@/lib/utils/api-retry';
import { APIError, ErrorCode } from '@/lib/utils/error-handler';

/**
 * K-Startup API XML 응답 타입
 */
interface KStartupXMLResponse {
  results?: {
    currentCount?: number;
    data?: {
      item?: KStartupXMLItem[] | KStartupXMLItem; // 단일 또는 배열
    };
    matchCount?: number;
    page?: number;
    perPage?: number;
    totalCount?: number;
  };
}

/**
 * K-Startup XML Item 구조 (<col name="...">value</col> 형식)
 */
interface KStartupXMLItem {
  col?: Array<{
    '#text'?: string;
    '@_name'?: string;
  }>;
}

/**
 * K-Startup 프로그램 데이터 구조 (실제 필드명)
 */
interface KStartupProgramData {
  pbanc_sn?: string; // 공고 일련번호
  biz_pbanc_nm?: string; // 사업공고명
  pblanc_ctgry_nm?: string; // 공고 카테고리명
  aply_trgt?: string; // 신청 대상
  aply_trgt_area?: string; // 신청 대상 지역
  supt_regin?: string; // 지원 지역 (정확한 지역 정보)
  sprt_dgr?: string; // 지원 정도 (예산 범위)
  rcpt_bgng_dt?: string; // 접수 시작일
  rcpt_end_dt?: string; // 접수 종료일
  pbanc_rcpt_bgng_dt?: string; // 공고 접수 시작일 (대체 필드명)
  pbanc_rcpt_end_dt?: string; // 공고 접수 마감일 (대체 필드명)
  pbanc_rgst_dt?: string; // 공고 등록일
  biz_pbanc_url?: string; // 사업공고 URL (레거시)
  detl_pg_url?: string; // 상세 페이지 URL (실제 공고 페이지)
  [key: string]: unknown;
}

/**
 * K-Startup API 클라이언트
 *
 * 한국벤처창업진흥원의 K-Startup API를 통해 정부지원사업 데이터를 조회
 *
 * API 엔드포인트: https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01
 * 파라미터:
 * - serviceKey: API 키 (필수)
 * - page: 페이지 번호 (1부터 시작)
 * - perPage: 페이지당 건수 (기본 10, 최대 100)
 */
export class KStartupAPIClient implements IProgramAPIClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = process.env.PUBLIC_DATA_API_KEY;
    const baseUrl = process.env.KSTARTUP_API_BASE_URL;

    if (!apiKey || !baseUrl) {
      throw new Error(
        'PUBLIC_DATA_API_KEY or KSTARTUP_API_BASE_URL is not defined in environment variables'
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * 데이터 소스 이름 반환
   */
  getDataSource(): string {
    return 'K-Startup';
  }

  /**
   * K-Startup API에서 프로그램 목록 조회 (XML 파싱)
   *
   * @param params - 페이지네이션 파라미터
   * @returns 원본 프로그램 데이터 배열
   */
  async fetchPrograms(params: SyncParams): Promise<RawProgramData[]> {
    console.log(`[KStartupAPI] Fetching programs: page=${params.page}, perPage=${params.pageSize}`);

    // RetryStrategy로 API 호출 (Exponential Backoff + Jitter)
    return withRetry(
      async () => {
        // API URL 생성 (getAnnouncementInformation01 엔드포인트)
        const url = `${this.baseUrl}/kisedKstartupService01/getAnnouncementInformation01?serviceKey=${encodeURIComponent(this.apiKey)}&page=${params.page}&perPage=${params.pageSize}`;

        // API 호출
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/xml',
          },
        });

        if (!response.ok) {
          // HTTP 상태 코드에 따라 적절한 ErrorCode 사용
          let errorCode: ErrorCode;
          if (response.status === 429) {
            errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
          } else if (response.status === 408 || response.status === 504) {
            errorCode = ErrorCode.API_TIMEOUT;
          } else if (response.status === 503) {
            errorCode = ErrorCode.API_UNAVAILABLE;
          } else {
            errorCode = ErrorCode.EXTERNAL_API_ERROR;
          }

          throw new APIError(
            errorCode,
            `[KStartupAPI] API error: ${response.status} ${response.statusText}`,
            { statusCode: response.status, statusText: response.statusText },
            response.status
          );
        }

        // XML 파싱
        const xmlText = await response.text();
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
        });
        const parsed: KStartupXMLResponse = parser.parse(xmlText);

        // XML 응답에서 아이템 추출
        const items = parsed.results?.data?.item;
        if (!items) {
          console.log('[KStartupAPI] No items in response');
          return [];
        }

        // 배열로 정규화 (단일 아이템일 경우 배열로 변환)
        const itemArray = Array.isArray(items) ? items : [items];

        // <col name="...">value</col> 구조를 평탄화
        const programs: KStartupProgramData[] = itemArray.map(item => {
          const program: KStartupProgramData = {};

          if (item.col && Array.isArray(item.col)) {
            item.col.forEach(col => {
              const name = col['@_name'];
              const value = col['#text'] || '';
              if (name) {
                program[name] = value;
              }
            });
          }

          return program;
        });

        console.log(`[KStartupAPI] ✅ Fetched ${programs.length} programs`);

        return programs as RawProgramData[];
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, delay, error) => {
          console.warn(`[KStartupAPI] ⚠️ Retry attempt ${attempt}, waiting ${delay}ms`, {
            error: error.message,
          });
        },
      }
    );
  }

  /**
   * 키워드 추출 (제목 + 카테고리에서 키워드 생성)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 키워드 배열
   */
  extractKeywords(raw: RawProgramData): string[] {
    const data = raw as KStartupProgramData;
    const keywords: string[] = [];

    // 제목에서 키워드 추출 (공백 분리)
    if (data.biz_pbanc_nm && typeof data.biz_pbanc_nm === 'string') {
      const titleWords = data.biz_pbanc_nm
        .split(/[\s,\/]+/)
        .filter((word: string) => word.length > 1);
      keywords.push(...titleWords);
    }

    // 지원 분야를 키워드로 추가
    if (data.supt_biz_clsfc && typeof data.supt_biz_clsfc === 'string') {
      keywords.push(data.supt_biz_clsfc);
    }

    // 신청 대상을 키워드로 추가
    if (data.aply_trgt && typeof data.aply_trgt === 'string') {
      const targets = data.aply_trgt.split(/[,\/]+/).map((t: string) => t.trim());
      keywords.push(...targets);
    }

    // 중복 제거 및 정리
    return Array.from(new Set(keywords)).slice(0, 15);
  }

  /**
   * 대상 지역 추출 (supt_regin 필드 우선, aply_trgt_area 대체)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 지역 배열
   */
  parseLocation(raw: RawProgramData): string[] {
    const data = raw as KStartupProgramData;
    const locations: string[] = [];

    // supt_regin 필드 우선 확인 (정확한 지역 정보)
    const regionField = data.supt_regin || data.aply_trgt_area;

    if (regionField && typeof regionField === 'string') {
      // 쉼표 또는 슬래시로 구분된 지역 분리
      const locationParts = regionField
        .split(/[,\/]+/)
        .map((loc: string) => loc.trim())
        .filter((loc: string) => loc.length > 0);
      locations.push(...locationParts);
    }

    // 기본값: 전국
    return locations.length > 0 ? locations : ['전국'];
  }

  /**
   * 대상 업종 추출 (aply_trgt 필드 활용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 업종 배열
   */
  parseTargetAudience(raw: RawProgramData): string[] {
    const data = raw as KStartupProgramData;
    const audiences: string[] = [];

    if (data.aply_trgt && typeof data.aply_trgt === 'string') {
      // 쉼표 또는 슬래시로 구분된 업종 분리
      const audienceParts = data.aply_trgt
        .split(/[,\/]+/)
        .map((aud: string) => aud.trim())
        .filter((aud: string) => aud.length > 0);
      audiences.push(...audienceParts);
    }

    // 기본값: 전체
    return audiences.length > 0 ? audiences : ['전체'];
  }

  /**
   * 등록일 추출 (pbanc_rcpt_bgng_dt 필드 활용, 교차 정렬용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 등록일 (Date 객체)
   */
  parseRegisteredAt(raw: RawProgramData): Date {
    const data = raw as KStartupProgramData;

    // pbanc_rcpt_bgng_dt 필드 파싱 시도 (신청 시작일, 형식: YYYYMMDD 또는 숫자)
    const dateField = data.pbanc_rcpt_bgng_dt || data.rcpt_bgng_dt || data.pbanc_rgst_dt;

    if (dateField) {
      // 숫자 또는 문자열을 YYYYMMDD 형식으로 변환
      let dateStr = String(dateField);

      // YYYYMMDD 형식을 YYYY-MM-DD로 변환
      if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
        dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      }

      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // 파싱 실패 시 현재 날짜 반환
    console.warn('[KStartupAPI] Failed to parse date field, using current date');
    return new Date();
  }

  /**
   * 공고 URL 추출 (detl_pg_url 필드 활용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 공고 URL (없으면 null)
   */
  parseSourceUrl(raw: RawProgramData): string | null {
    const data = raw as KStartupProgramData;
    return (data.detl_pg_url as string) || null;
  }

  /**
   * 시작일 추출 (pbanc_rcpt_bgng_dt 필드 활용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 시작일 (Date 객체 또는 null)
   */
  parseStartDate(raw: RawProgramData): Date | null {
    const data = raw as KStartupProgramData;

    // pbanc_rcpt_bgng_dt 또는 rcpt_bgng_dt 필드 파싱 시도 (형식: YYYYMMDD 또는 숫자)
    const dateField = data.pbanc_rcpt_bgng_dt || data.rcpt_bgng_dt;

    if (dateField) {
      // 숫자 또는 문자열을 YYYYMMDD 형식으로 변환
      let dateStr = String(dateField);

      // YYYYMMDD 형식을 YYYY-MM-DD로 변환
      if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
        dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      }

      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }

  /**
   * 마감일 추출 (pbanc_rcpt_end_dt 필드 활용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 마감일 (Date 객체 또는 null)
   */
  parseDeadline(raw: RawProgramData): Date | null {
    const data = raw as KStartupProgramData;

    // pbanc_rcpt_end_dt 또는 rcpt_end_dt 필드 파싱 시도 (형식: YYYYMMDD 또는 숫자)
    const dateField = data.pbanc_rcpt_end_dt || data.rcpt_end_dt;

    if (dateField) {
      // 숫자 또는 문자열을 YYYYMMDD 형식으로 변환
      let dateStr = String(dateField);

      // YYYYMMDD 형식을 YYYY-MM-DD로 변환
      if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
        dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      }

      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }

  /**
   * 첨부파일 URL 추출
   *
   * @param _raw - 원본 프로그램 데이터
   * @returns 첨부파일 URL (없으면 null)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parseAttachmentUrl(_raw: RawProgramData): string | null {
    // K-Startup API는 첨부파일 정보를 제공하지 않음
    return null;
  }
}
