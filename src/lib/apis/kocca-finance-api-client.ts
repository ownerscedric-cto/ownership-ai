/**
 * @file kocca-finance-api-client.ts
 * @description 한국콘텐츠진흥원 Finance API 클라이언트 (금융지원)
 * Phase 3: 다중 API 통합 연동
 */

import type { IProgramAPIClient, RawProgramData, SyncParams } from './base-api-client';

/**
 * KOCCA Finance API 응답 타입 (실제 응답 구조)
 */
interface KoccaFinanceResponse {
  INFO?: {
    resultCode?: string;
    resultMgs?: string;
    title?: string;
    boardTitle?: string;
    cate?: string;
    viewStartDt?: string;
    viewEndDt?: string;
    pageNo?: number;
    numOfRows?: number;
    listCount?: number;
    list?: KoccaFinanceProgramData[];
  };
}

/**
 * KOCCA Finance 프로그램 데이터 구조 (실제 필드명)
 */
interface KoccaFinanceProgramData {
  title?: string; // 제목
  cate?: string; // 카테고리 (예: "융자지원")
  genre?: string; // 장르/분야
  hit?: number; // 조회수
  regDate?: string; // 등록일 (YYYYMMDD)
  endDt?: string; // 마감일 (YYYYMMDD)
  link?: string; // 원본 URL (여기서 ID 추출 가능: .../1846560.do)
  content?: string; // 상세 내용
  seq?: string; // 게시글 ID (link에서 추출)
  [key: string]: unknown;
}

/**
 * KOCCA Finance API 클라이언트
 *
 * 한국콘텐츠진흥원의 Finance (금융지원) API를 통해 정부지원사업 데이터를 조회
 *
 * API 엔드포인트: https://kocca.kr/api/finance/List.do
 * 파라미터:
 * - serviceKey: API 키 (필수)
 * - pageNo: 페이지 번호 (1부터 시작)
 * - numOfRows: 페이지당 건수
 */
export class KoccaFinanceAPIClient implements IProgramAPIClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = process.env.KOCCA_FIN_API_KEY;
    const baseUrl = process.env.KOCCA_FINANCE_API_BASE_URL;

    if (!apiKey || !baseUrl) {
      throw new Error(
        'KOCCA_FIN_API_KEY or KOCCA_FINANCE_API_BASE_URL is not defined in environment variables'
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * 데이터 소스 이름 반환
   */
  getDataSource(): string {
    return 'KOCCA-Finance';
  }

  /**
   * KOCCA Finance API에서 프로그램 목록 조회
   *
   * @param params - 페이지네이션 파라미터
   * @returns 원본 프로그램 데이터 배열
   */
  async fetchPrograms(params: SyncParams): Promise<RawProgramData[]> {
    try {
      // 조회 시작일/종료일 설정 (2020년부터 현재까지 - Finance API는 과거 데이터 보유)
      const today = new Date();
      const startDate = new Date('2020-01-01');

      const viewStartDt = startDate.toISOString().split('T')[0].replace(/-/g, '');
      const viewEndDt = today.toISOString().split('T')[0].replace(/-/g, '');

      // API URL 생성 (cate, viewStartDt, viewEndDt 파라미터 추가)
      const url = `${this.baseUrl}?serviceKey=${encodeURIComponent(this.apiKey)}&cate=a2&pageNo=${params.page}&numOfRows=${params.pageSize}&viewStartDt=${viewStartDt}&viewEndDt=${viewEndDt}`;

      console.log(
        `[KoccaFinanceAPI] Fetching programs: pageNo=${params.page}, numOfRows=${params.pageSize}, viewStartDt=${viewStartDt}, viewEndDt=${viewEndDt}`
      );

      // API 호출
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`KOCCA Finance API error: ${response.status} ${response.statusText}`);
      }

      const data: KoccaFinanceResponse = await response.json();

      // 응답 데이터 추출 (실제 응답은 data.INFO.list)
      const programs = data.INFO?.list || [];

      // 각 프로그램에 link에서 추출한 seq 추가
      const programsWithSeq = programs.map(program => {
        // link에서 ID 추출: www.kocca.kr/kocca/bbs/view/B0158960/1846560.do → 1846560
        if (program.link && typeof program.link === 'string') {
          const match = program.link.match(/\/(\d+)\.do/);
          if (match && match[1]) {
            return { ...program, seq: match[1] };
          }
        }
        return program;
      });

      console.log(`[KoccaFinanceAPI] Fetched ${programsWithSeq.length} programs`);

      return programsWithSeq as RawProgramData[];
    } catch (error) {
      console.error('[KoccaFinanceAPI] Error fetching programs:', error);
      throw error;
    }
  }

  /**
   * 키워드 추출 (제목 + 카테고리에서 키워드 생성)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 키워드 배열
   */
  extractKeywords(raw: RawProgramData): string[] {
    const data = raw as KoccaFinanceProgramData;
    const keywords: string[] = [];

    // 제목에서 키워드 추출 (간단한 공백 분리)
    if (data.title && typeof data.title === 'string') {
      const titleWords = data.title.split(/[\s,\/]+/).filter(word => word.length > 1);
      keywords.push(...titleWords);
    }

    // 카테고리를 키워드로 추가 (cate 필드 사용)
    if (data.cate && typeof data.cate === 'string') {
      keywords.push(data.cate);
    }

    // 장르/분야를 키워드로 추가
    if (data.genre && typeof data.genre === 'string') {
      keywords.push(data.genre);
    }

    // 금융지원 관련 키워드 추가
    keywords.push('금융', '투자', '콘텐츠');

    // 중복 제거 및 정리
    return Array.from(new Set(keywords)).slice(0, 10);
  }

  /**
   * 대상 지역 추출
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 지역 배열
   */
  parseLocation(_raw: RawProgramData): string[] {
    // KOCCA Finance API는 지역 정보를 제공하지 않음
    // 금융지원은 대부분 전국 대상
    return ['전국'];
  }

  /**
   * 대상 업종 추출
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 업종 배열
   */
  parseTargetAudience(_raw: RawProgramData): string[] {
    // KOCCA Finance API는 대상 업종 정보를 제공하지 않음
    // 콘텐츠 산업 금융지원이 주 대상
    return ['콘텐츠산업', '문화산업'];
  }

  /**
   * 등록일 추출 (교차 정렬용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 등록일 (Date 객체)
   */
  parseRegisteredAt(raw: RawProgramData): Date {
    const data = raw as KoccaFinanceProgramData;

    // regDate 필드 파싱 시도 (형식: YYYYMMDD)
    if (data.regDate && typeof data.regDate === 'string') {
      let dateStr = data.regDate;

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
    console.warn('[KoccaFinanceAPI] Failed to parse regDate, using current date');
    return new Date();
  }

  /**
   * 공고 URL 추출 (link 필드 활용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 공고 URL (없으면 null)
   */
  parseSourceUrl(raw: RawProgramData): string | null {
    const data = raw as KoccaFinanceProgramData;

    // KOCCA Finance는 프로토콜 없이 제공하므로 https:// 추가
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
   * 시작일 추출
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 시작일 (Date 객체 또는 null)
   */
  parseStartDate(_raw: RawProgramData): Date | null {
    // KOCCA Finance API는 시작일 정보를 제공하지 않음
    return null;
  }

  /**
   * 마감일 추출
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 마감일 (Date 객체 또는 null)
   */
  parseDeadline(raw: RawProgramData): Date | null {
    const data = raw as KoccaFinanceProgramData;

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
}
