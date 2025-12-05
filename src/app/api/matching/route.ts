/**
 * @file /api/matching/route.ts
 * @description 매칭 시스템 API 엔드포인트
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템
 */

import { NextRequest, NextResponse } from 'next/server';
import { runMatching } from '@/lib/matching/matching-algorithm';
import { matchingRequestSchema } from '@/lib/types/matching';
import { createErrorResponse, logError } from '@/lib/utils/error-handler';

/**
 * POST /api/matching
 *
 * 고객에 대한 프로그램 매칭 실행
 *
 * Request Body:
 * - customerId: string (required)
 * - minScore?: number (optional, default: 30)
 * - maxResults?: number (optional, default: 10)
 * - forceRefresh?: boolean (optional, default: false)
 *
 * 응답:
 * - success: true
 * - data: MatchingResultWithDetails[]
 * - metadata: { total: number }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Request Body 파싱 및 검증
    const body = await request.json();
    const validation = matchingRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid request body',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { customerId } = validation.data;
    const minScore = body.minScore ?? 30;
    const maxResults = body.maxResults ?? 50;
    const forceRefresh = body.forceRefresh ?? false;

    console.log(
      `[POST /api/matching] Running matching for customer: ${customerId}, minScore: ${minScore}, maxResults: ${maxResults}, forceRefresh: ${forceRefresh}`
    );

    // 2. 매칭 알고리즘 실행
    const results = await runMatching({
      customerId,
      minScore,
      maxResults,
      forceRefresh,
    });

    console.log(`[POST /api/matching] ✅ Matching completed: ${results.length} results`);

    // 3. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: results,
        metadata: {
          total: results.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // 에러 로깅 (심각도별 자동 분류)
    logError(error, { context: 'POST /api/matching', operation: 'run-matching' });

    // 표준 에러 응답 생성
    const errorResponse = createErrorResponse(error);

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
