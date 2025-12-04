/**
 * @file kocca-pims-api-client.ts
 * @description 한국콘텐츠진흥원 PIMS API 클라이언트 (지원사업)
 * Phase 3: 다중 API 통합 연동
 */

import type { IProgramAPIClient, RawProgramData, SyncParams } from './base-api-client';
import { withRetry } from '@/lib/utils/api-retry';
import { APIError, ErrorCode } from '@/lib/utils/error-handler';

/**
 * KOCCA PIMS API 응답 타입 (실제 응답 구조)
 */
interface KoccaPIMSResponse {
  INFO?: {
    resultCode?: string;
    resultMgs?: string;
    title?: string;
    boardTitle?: string;
    viewStartDt?: string;
    pageNo?: number;
    numOfRows?: number;
    listCount?: number;
    list?: KoccaPIMSProgramData[];
  };
}

/**
 * KOCCA PIMS 프로그램 데이터 구조 (실제 필드명)
 */
interface KoccaPIMSProgramData {
  intcNoSeq?: string; // 공고 ID (예: "3-25-D000-016")
  title?: string; // 제목
  cate?: string; // 카테고리 (예: "모집공고")
  regDt?: string; // 등록일 (YYYYMMDD)
  startDt?: string; // 시작일 (YYYYMMDD)
  endDt?: string; // 종료일 (YYYYMMDD)
  content?: string; // 상세 내용
  link?: string; // 원본 URL
  hit?: number; // 조회수
  [key: string]: unknown;
}

/**
 * KOCCA PIMS API 클라이언트
 *
 * 한국콘텐츠진흥원의 PIMS (지원사업) API를 통해 정부지원사업 데이터를 조회
 *
 * API 엔드포인트: https://kocca.kr/api/pims/List.do
 * 파라미터:
 * - serviceKey: API 키 (필수)
 * - pageNo: 페이지 번호 (1부터 시작)
 * - numOfRows: 페이지당 건수
 * - viewStartDt: 조회 시작일 (YYYYMMDD)
 */
export class KoccaPIMSAPIClient implements IProgramAPIClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = process.env.KOCCA_PIMS_API_KEY;
    const baseUrl = process.env.KOCCA_PIMS_API_BASE_URL;

    if (!apiKey || !baseUrl) {
      throw new Error(
        'KOCCA_PIMS_API_KEY or KOCCA_PIMS_API_BASE_URL is not defined in environment variables'
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * 데이터 소스 이름 반환
   */
  getDataSource(): string {
    return 'KOCCA-PIMS';
  }

  /**
   * KOCCA PIMS API에서 프로그램 목록 조회
   *
   * @param params - 페이지네이션 파라미터
   * @returns 원본 프로그램 데이터 배열
   */
  async fetchPrograms(params: SyncParams): Promise<RawProgramData[]> {
    // ⭐ 증분 동기화: registeredAfter가 있으면 사용, 없으면 최근 3년 데이터
    let viewStartDt: string;
    if (params.registeredAfter) {
      viewStartDt = params.registeredAfter.toISOString().split('T')[0].replace(/-/g, '');
      console.log(`[KoccaPIMSAPI] 🔄 Incremental sync from ${viewStartDt} (registeredAfter)`);
    } else {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      viewStartDt = threeYearsAgo.toISOString().split('T')[0].replace(/-/g, '');
      console.log(`[KoccaPIMSAPI] 🔄 Full sync from ${viewStartDt} (last 3 years)`);
    }

    console.log(
      `[KoccaPIMSAPI] Fetching programs: pageNo=${params.page}, numOfRows=${params.pageSize}`
    );

    // RetryStrategy로 API 호출 (Exponential Backoff + Jitter)
    return withRetry(
      async () => {
        // API URL 생성
        const url = `${this.baseUrl}?serviceKey=${encodeURIComponent(this.apiKey)}&pageNo=${params.page}&numOfRows=${params.pageSize}&viewStartDt=${viewStartDt}`;

        // API 호출
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
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
            `[KoccaPIMSAPI] API error: ${response.status} ${response.statusText}`,
            { statusCode: response.status, statusText: response.statusText },
            response.status
          );
        }

        const data: KoccaPIMSResponse = await response.json();

        // 응답 데이터 추출 (실제 응답은 data.INFO.list)
        const programs = data.INFO?.list || [];

        console.log(`[KoccaPIMSAPI] ✅ Fetched ${programs.length} programs`);

        return programs as RawProgramData[];
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, delay, error) => {
          console.warn(`[KoccaPIMSAPI] ⚠️ Retry attempt ${attempt}, waiting ${delay}ms`, {
            error: error.message,
          });
        },
      }
    );
  }

  /**
   * 키워드 추출 (제목 + 설명에서 키워드 생성)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 키워드 배열
   */
  extractKeywords(raw: RawProgramData): string[] {
    const data = raw as KoccaPIMSProgramData;
    const keywords: string[] = [];

    // 제목에서 키워드 추출 (간단한 공백 분리)
    if (data.title && typeof data.title === 'string') {
      const titleWords = data.title.split(/[\s,\/]+/).filter(word => word.length > 1);
      keywords.push(...titleWords);
    }

    // 카테고리를 키워드로 추가
    if (data.cate && typeof data.cate === 'string') {
      keywords.push(data.cate);
    }

    // 콘텐츠 산업 관련 키워드 추가
    keywords.push('콘텐츠', '문화');

    // 중복 제거 및 정리
    return Array.from(new Set(keywords)).slice(0, 10);
  }

  /**
   * 대상 지역 추출
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 지역 배열
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parseLocation(_raw: RawProgramData): string[] {
    // KOCCA-PIMS API는 지역 정보를 제공하지 않음
    // 콘텐츠 진흥 사업은 대부분 전국 대상
    return ['전국'];
  }

  /**
   * 대상 업종 추출
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 업종 배열
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parseTargetAudience(_raw: RawProgramData): string[] {
    // KOCCA-PIMS API는 대상 업종 정보를 제공하지 않음
    // 한국콘텐츠진흥원은 콘텐츠 산업이 주 대상
    return ['콘텐츠산업', '문화산업'];
  }

  /**
   * 등록일 추출 (교차 정렬용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 등록일 (Date 객체)
   */
  parseRegisteredAt(raw: RawProgramData): Date {
    const data = raw as KoccaPIMSProgramData;

    // regDt 필드 파싱 시도 (형식: YYYYMMDD)
    if (data.regDt && typeof data.regDt === 'string') {
      let dateStr = data.regDt;

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
    console.warn('[KoccaPIMSAPI] Failed to parse regDt, using current date');
    return new Date();
  }

  /**
   * 공고 URL 추출 (link 필드 활용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 공고 URL (없으면 null)
   */
  parseSourceUrl(raw: RawProgramData): string | null {
    const data = raw as KoccaPIMSProgramData;

    // KOCCA PIMS는 프로토콜 없이 제공하므로 https:// 추가
    if (data.link && typeof data.link === 'string') {
      // 이미 프로토콜이 있는 경우 그대로 반환
      if (data.link.startsWith('http://') || data.link.startsWith('https://')) {
        return data.link;
      }
      // 프로토콜이 없으면 https:// 추가
      return `https://${data.link}`;
    }

    return null;
  }

  /**
   * 시작일 추출 (startDt 필드 활용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 시작일 (Date 객체 또는 null)
   */
  parseStartDate(raw: RawProgramData): Date | null {
    const data = raw as KoccaPIMSProgramData;

    // startDt 필드 파싱 시도 (형식: YYYYMMDD)
    if (data.startDt && typeof data.startDt === 'string') {
      let dateStr = data.startDt;

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
   * 마감일 추출 (endDt 필드 활용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 마감일 (Date 객체 또는 null)
   */
  parseDeadline(raw: RawProgramData): Date | null {
    const data = raw as KoccaPIMSProgramData;

    // endDt 필드 파싱 시도 (형식: YYYYMMDD)
    if (data.endDt && typeof data.endDt === 'string') {
      let dateStr = data.endDt;

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
    // KOCCA PIMS API는 첨부파일 정보를 제공하지 않음
    return null;
  }
}
