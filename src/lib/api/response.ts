import { NextResponse } from 'next/server';

// 표준 성공 응답 타입
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

// 표준 에러 응답 타입
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// API 응답 타입
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// 성공 응답 헬퍼
export function successResponse<T>(
  data: T,
  metadata?: SuccessResponse['metadata'],
  status = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(metadata && { metadata }),
    },
    { status }
  );
}

// 에러 응답 헬퍼
export function errorResponse(
  code: string,
  message: string,
  details?: unknown,
  status = 400
): NextResponse<ErrorResponse> {
  const error: ErrorResponse['error'] = {
    code,
    message,
  };

  if (details !== undefined && details !== null) {
    error.details = details;
  }

  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

// 에러 코드 상수
export const ErrorCode = {
  // 400 Bad Request
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // 401 Unauthorized
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // 403 Forbidden
  FORBIDDEN: 'FORBIDDEN',
  ACCESS_DENIED: 'ACCESS_DENIED',

  // 404 Not Found
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // 500 Internal Server Error
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // 502 Bad Gateway
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
