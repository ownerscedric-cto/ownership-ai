/**
 * @file /api/matching/[id]/route.ts
 * @description 고객별 매칭 결과 조회 API
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createErrorResponse, logError } from '@/lib/utils/error-handler';

/**
 * GET /api/matching/[id]
 *
 * 고객의 매칭 결과 조회
 *
 * Path Parameters:
 * - id: string (required) - Customer ID
 *
 * Query Parameters:
 * - limit?: number (optional, default: 10, max: 100)
 * - minScore?: number (optional, default: 0, 최소 점수 필터)
 *
 * 응답:
 * - success: true
 * - data: MatchingResultWithDetails[]
 * - metadata: { total: number, limit: number }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Path Parameters 파싱
    const { id: customerId } = await params;
    const supabase = await createClient();

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Customer ID is required',
          },
        },
        { status: 400 }
      );
    }

    // 2. Query Parameters 파싱
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);
    const minScore = parseFloat(searchParams.get('minScore') || '0');

    console.log(
      `[GET /api/matching/${customerId}] Fetching matching results: limit=${limit}, minScore=${minScore}`
    );

    // 3. 고객 존재 여부 확인
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: `Customer not found: ${customerId}`,
          },
        },
        { status: 404 }
      );
    }

    // 4. 매칭 결과 조회
    const { data: results, error: matchingError } = await supabase
      .from('matching_results')
      .select(`
        *,
        program:programs (
          id,
          title,
          description,
          category,
          targetAudience,
          targetLocation,
          keywords,
          budgetRange,
          deadline,
          sourceUrl,
          dataSource,
          rawData
        )
      `)
      .eq('customerId', customerId)
      .gte('score', minScore)
      .order('score', { ascending: false })
      .limit(limit);

    if (matchingError) {
      console.error('Matching results fetch error:', matchingError);
      return NextResponse.json(createErrorResponse(matchingError), { status: 500 });
    }

    console.log(`[GET /api/matching/${customerId}] ✅ Fetched ${results?.length || 0} matching results`);

    // 5. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: results || [],
        metadata: {
          total: results?.length || 0,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // 에러 로깅 (심각도별 자동 분류)
    logError(error, { context: 'GET /api/matching/[id]', operation: 'fetch' });

    // 표준 에러 응답 생성
    const errorResponse = createErrorResponse(error);

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
