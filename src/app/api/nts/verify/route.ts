import { NextRequest } from 'next/server';
import { verifyBusinessRegistration, NtsApiError } from '@/lib/api/nts';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { z } from 'zod';

/**
 * 요청 검증 스키마
 */
const verifyRequestSchema = z.object({
  businessNumbers: z
    .array(z.string())
    .min(1, '최소 1개 이상의 사업자등록번호를 입력해주세요')
    .max(100, '최대 100개까지 조회할 수 있습니다'),
});

/**
 * POST /api/nts/verify
 * 국세청 사업자등록정보 진위확인 API
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디 파싱
    const body = await request.json();

    // 2. 유효성 검증
    const validationResult = verifyRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력 데이터가 유효하지 않습니다',
        validationResult.error.issues,
        400
      );
    }

    const { businessNumbers } = validationResult.data;

    // 3. 국세청 API 호출
    const results = await verifyBusinessRegistration(businessNumbers);

    // 4. 성공 응답
    return successResponse(results);
  } catch (error) {
    // NtsApiError 처리
    if (error instanceof NtsApiError) {
      // API 키 누락
      if (error.code === 'MISSING_API_KEY') {
        return errorResponse(ErrorCode.INTERNAL_ERROR, error.message, error.details, 500);
      }

      // 입력 유효성 에러
      if (
        error.code === 'INVALID_INPUT' ||
        error.code === 'INVALID_BUSINESS_NUMBER' ||
        error.code === 'TOO_MANY_REQUESTS'
      ) {
        return errorResponse(ErrorCode.VALIDATION_ERROR, error.message, error.details, 400);
      }

      // API 요청 실패
      if (error.code === 'API_REQUEST_FAILED' || error.code === 'API_ERROR_RESPONSE') {
        return errorResponse(ErrorCode.EXTERNAL_API_ERROR, error.message, error.details, 502);
      }

      // 기타 NtsApiError
      return errorResponse(ErrorCode.INTERNAL_ERROR, error.message, error.details, 500);
    }

    // Zod 유효성 검증 에러
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력 데이터가 유효하지 않습니다',
        error.issues,
        400
      );
    }

    // 기타 에러
    console.error('NTS API error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '사업자 정보 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
