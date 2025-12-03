/**
 * @file base-api-client.ts
 * @description 정부지원사업 API 클라이언트 공통 인터페이스
 * Phase 3: 다중 API 통합 연동 (기업마당, K-Startup, KOCCA)
 */

/**
 * API 동기화 파라미터
 */
export interface SyncParams {
  page: number;
  pageSize: number;
}

/**
 * 원본 프로그램 데이터 (API 응답)
 * 각 API별로 다른 필드를 가질 수 있으므로 any 타입 사용
 */
export interface RawProgramData {
  // 각 API에서 제공하는 원본 ID (필수)
  id?: string;
  announcementId?: string;
  bizId?: string;
  // 나머지 필드는 API별로 다름
  [key: string]: unknown;
}

/**
 * 정부지원사업 API 클라이언트 공통 인터페이스
 *
 * 모든 API 클라이언트는 이 인터페이스를 구현해야 함
 * - 기업마당 API
 * - K-Startup API
 * - KOCCA-PIMS API
 * - KOCCA-Finance API
 */
export interface IProgramAPIClient {
  /**
   * API 데이터 소스 이름 반환
   * @returns "기업마당" | "K-Startup" | "KOCCA-PIMS" | "KOCCA-Finance"
   */
  getDataSource(): string;

  /**
   * API에서 프로그램 목록 조회
   * @param params - 페이지네이션 파라미터
   * @returns 원본 프로그램 데이터 배열
   */
  fetchPrograms(params: SyncParams): Promise<RawProgramData[]>;

  /**
   * 원본 데이터에서 키워드 추출
   * @param raw - 원본 프로그램 데이터
   * @returns 키워드 배열
   */
  extractKeywords(raw: RawProgramData): string[];

  /**
   * 원본 데이터에서 대상 지역 추출
   * @param raw - 원본 프로그램 데이터
   * @returns 지역 배열
   */
  parseLocation(raw: RawProgramData): string[];

  /**
   * 원본 데이터에서 대상 업종 추출
   * @param raw - 원본 프로그램 데이터
   * @returns 업종 배열
   */
  parseTargetAudience(raw: RawProgramData): string[];

  /**
   * 원본 데이터에서 등록일 추출 (교차 정렬용)
   * @param raw - 원본 프로그램 데이터
   * @returns 등록일 (Date 객체)
   */
  parseRegisteredAt(raw: RawProgramData): Date;

  /**
   * 원본 데이터에서 공고 URL 추출
   * @param raw - 원본 프로그램 데이터
   * @returns 공고 URL (없으면 null)
   */
  parseSourceUrl(raw: RawProgramData): string | null;

  /**
   * 원본 데이터에서 시작일 추출
   * @param raw - 원본 프로그램 데이터
   * @returns 시작일 (Date 객체 또는 null)
   */
  parseStartDate(raw: RawProgramData): Date | null;

  /**
   * 원본 데이터에서 마감일 추출
   * @param raw - 원본 프로그램 데이터
   * @returns 마감일 (Date 객체 또는 null)
   */
  parseDeadline(raw: RawProgramData): Date | null;
}
