/**
 * @file /api/matching/[id]/route.ts
 * @description 고객별 매칭 결과 조회 API
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createErrorResponse, logError } from '@/lib/utils/error-handler';

const prisma = new PrismaClient();

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
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
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
    const results = await prisma.matchingResult.findMany({
      where: {
        customerId,
        score: {
          gte: minScore,
        },
      },
      orderBy: {
        score: 'desc',
      },
      take: limit,
      include: {
        program: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            targetAudience: true,
            targetLocation: true,
            keywords: true,
            budgetRange: true,
            deadline: true,
            sourceUrl: true,
            dataSource: true,
            rawData: true,
          },
        },
      },
    });

    console.log(`[GET /api/matching/${customerId}] ✅ Fetched ${results.length} matching results`);

    // 5. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: results,
        metadata: {
          total: results.length,
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
  } finally {
    await prisma.$disconnect();
  }
}
