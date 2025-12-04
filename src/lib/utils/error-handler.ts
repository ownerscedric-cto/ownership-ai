/**
 * @file error-handler.ts
 * @description 통합 에러 처리 시스템
 * Phase 3: 에러 처리 개선
 */

/**
 * 에러 심각도 레벨
 */
export enum ErrorSeverity {
  LOW = 'low', // 사용자 입력 오류 등 (400번대)
  MEDIUM = 'medium', // 외부 API 오류, Rate Limit 등 (429, 503)
  HIGH = 'high', // 서버 내부 오류 (500번대)
  CRITICAL = 'critical', // 데이터베이스 연결 실패 등
}

/**
 * 에러 코드 표준 정의
 */
export enum ErrorCode {
  // 입력 검증 오류 (400번대)
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // 인증/권한 오류 (401, 403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // 리소스 오류 (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // 외부 API 오류 (502, 503)
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  API_UNAVAILABLE = 'API_UNAVAILABLE',

  // 데이터베이스 오류 (500)
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',

  // 서버 내부 오류 (500)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',

  // 네트워크 오류
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
}

/**
 * 사용자 친화적 에러 메시지 매핑
 */
const USER_FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
  // 입력 검증 오류
  [ErrorCode.INVALID_INPUT]: '입력값이 올바르지 않습니다. 다시 확인해주세요.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: '필수 입력 항목이 누락되었습니다.',
  [ErrorCode.INVALID_FORMAT]: '입력 형식이 올바르지 않습니다.',

  // 인증/권한 오류
  [ErrorCode.UNAUTHORIZED]: '로그인이 필요합니다.',
  [ErrorCode.FORBIDDEN]: '접근 권한이 없습니다.',

  // 리소스 오류
  [ErrorCode.NOT_FOUND]: '요청하신 정보를 찾을 수 없습니다.',
  [ErrorCode.RESOURCE_NOT_FOUND]: '해당 리소스를 찾을 수 없습니다.',

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',

  // 외부 API 오류
  [ErrorCode.EXTERNAL_API_ERROR]:
    '외부 서비스 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.API_TIMEOUT]: 'API 응답 시간이 초과되었습니다. 다시 시도해주세요.',
  [ErrorCode.API_UNAVAILABLE]: '현재 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해주세요.',

  // 데이터베이스 오류
  [ErrorCode.DATABASE_ERROR]: '데이터 처리 중 오류가 발생했습니다.',
  [ErrorCode.DATABASE_CONNECTION_ERROR]: '데이터베이스 연결에 실패했습니다.',

  // 서버 내부 오류
  [ErrorCode.INTERNAL_SERVER_ERROR]: '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',

  // 네트워크 오류
  [ErrorCode.NETWORK_ERROR]: '네트워크 연결을 확인해주세요.',
  [ErrorCode.CONNECTION_TIMEOUT]: '연결 시간이 초과되었습니다.',
};

/**
 * HTTP 상태 코드 매핑
 */
const STATUS_CODE_MAP: Record<ErrorCode, number> = {
  // 400번대
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  // 500번대
  [ErrorCode.EXTERNAL_API_ERROR]: 502,
  [ErrorCode.API_TIMEOUT]: 504,
  [ErrorCode.API_UNAVAILABLE]: 503,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.DATABASE_CONNECTION_ERROR]: 500,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.UNKNOWN_ERROR]: 500,
  [ErrorCode.NETWORK_ERROR]: 503,
  [ErrorCode.CONNECTION_TIMEOUT]: 504,
};

/**
 * 에러 심각도 매핑
 */
const SEVERITY_MAP: Record<ErrorCode, ErrorSeverity> = {
  // LOW (사용자 입력 오류)
  [ErrorCode.INVALID_INPUT]: ErrorSeverity.LOW,
  [ErrorCode.MISSING_REQUIRED_FIELD]: ErrorSeverity.LOW,
  [ErrorCode.INVALID_FORMAT]: ErrorSeverity.LOW,
  [ErrorCode.UNAUTHORIZED]: ErrorSeverity.LOW,
  [ErrorCode.FORBIDDEN]: ErrorSeverity.LOW,
  [ErrorCode.NOT_FOUND]: ErrorSeverity.LOW,
  [ErrorCode.RESOURCE_NOT_FOUND]: ErrorSeverity.LOW,

  // MEDIUM (외부 API 오류)
  [ErrorCode.RATE_LIMIT_EXCEEDED]: ErrorSeverity.MEDIUM,
  [ErrorCode.EXTERNAL_API_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorCode.API_TIMEOUT]: ErrorSeverity.MEDIUM,
  [ErrorCode.API_UNAVAILABLE]: ErrorSeverity.MEDIUM,
  [ErrorCode.NETWORK_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorCode.CONNECTION_TIMEOUT]: ErrorSeverity.MEDIUM,

  // HIGH (서버 내부 오류)
  [ErrorCode.INTERNAL_SERVER_ERROR]: ErrorSeverity.HIGH,
  [ErrorCode.UNKNOWN_ERROR]: ErrorSeverity.HIGH,

  // CRITICAL (데이터베이스 오류)
  [ErrorCode.DATABASE_ERROR]: ErrorSeverity.CRITICAL,
  [ErrorCode.DATABASE_CONNECTION_ERROR]: ErrorSeverity.CRITICAL,
};

/**
 * 통합 에러 클래스
 *
 * 표준화된 에러 응답을 생성하고 사용자 친화적 메시지를 제공
 *
 * @example
 * ```typescript
 * throw new APIError(
 *   ErrorCode.RATE_LIMIT_EXCEEDED,
 *   '공공데이터포털 API 호출 한도 초과',
 *   { remainingQuota: 0, resetTime: '2025-01-22 00:00:00' }
 * );
 * ```
 */
export class APIError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly severity: ErrorSeverity;
  public readonly userMessage: string;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    statusCode?: number
  ) {
    super(message);

    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode || STATUS_CODE_MAP[code] || 500;
    this.severity = SEVERITY_MAP[code] || ErrorSeverity.HIGH;
    this.userMessage = USER_FRIENDLY_MESSAGES[code] || '오류가 발생했습니다.';
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Stack trace 보존
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * API 응답 형식으로 변환
   *
   * @returns 표준 에러 응답 객체
   */
  toResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.userMessage, // 사용자에게는 친화적 메시지 전달
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }

  /**
   * 로깅용 상세 정보 반환
   *
   * @returns 로그 출력용 객체
   */
  toLog() {
    return {
      name: this.name,
      code: this.code,
      message: this.message, // 개발자용 원본 메시지
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * HTTP 상태 코드에서 ErrorCode 추론
 *
 * @param statusCode - HTTP 상태 코드
 * @returns 해당하는 ErrorCode
 */
export function inferErrorCodeFromStatus(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 400:
      return ErrorCode.INVALID_INPUT;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 429:
      return ErrorCode.RATE_LIMIT_EXCEEDED;
    case 500:
      return ErrorCode.INTERNAL_SERVER_ERROR;
    case 502:
      return ErrorCode.EXTERNAL_API_ERROR;
    case 503:
      return ErrorCode.API_UNAVAILABLE;
    case 504:
      return ErrorCode.API_TIMEOUT;
    default:
      return ErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * 표준 에러 응답 생성 (헬퍼 함수)
 *
 * @param error - 발생한 에러 (APIError 또는 일반 Error)
 * @returns 표준 에러 응답 객체
 *
 * @example
 * ```typescript
 * try {
 *   // ...
 * } catch (error) {
 *   return Response.json(createErrorResponse(error), { status: 500 });
 * }
 * ```
 */
export function createErrorResponse(error: unknown) {
  // APIError인 경우
  if (error instanceof APIError) {
    return error.toResponse();
  }

  // 일반 Error인 경우
  if (error instanceof Error) {
    const apiError = new APIError(ErrorCode.INTERNAL_SERVER_ERROR, error.message, {
      originalError: error.name,
    });
    return apiError.toResponse();
  }

  // 기타 (string, unknown 등)
  const apiError = new APIError(ErrorCode.UNKNOWN_ERROR, String(error), { originalValue: error });
  return apiError.toResponse();
}

/**
 * 에러 로깅 (헬퍼 함수)
 *
 * @param error - 발생한 에러
 * @param context - 추가 컨텍스트 정보
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  if (error instanceof APIError) {
    const logData = error.toLog();

    // 심각도에 따라 다른 로그 레벨 사용
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      console.error('[APIError]', logData, context);
    } else if (error.severity === ErrorSeverity.MEDIUM) {
      console.warn('[APIError]', logData, context);
    } else {
      console.info('[APIError]', logData, context);
    }
  } else {
    console.error('[Error]', error, context);
  }
}
