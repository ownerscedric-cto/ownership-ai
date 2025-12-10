/**
 * @file /api/programs/[id]/route.ts
 * @description 정부지원사업 프로그램 상세 조회 API
 * Phase 3: 다중 API 통합 연동
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { APIError, ErrorCode, createErrorResponse, logError } from '@/lib/utils/error-handler';

/**
 * GET /api/programs/[id]
 *
 * 정부지원사업 프로그램 상세 조회
 *
 * Path Parameters:
 * - id: 프로그램 ID (UUID)
 *
 * 응답:
 * - success: true
 * - data: Program (rawData 포함)
 * - metadata: null
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    console.log(`[GET /api/programs/${id}] Fetching program details...`);

    // 프로그램 조회
    const { data: program, error: fetchError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single();

    // 프로그램이 없으면 404 반환
    if (fetchError || !program) {
      const notFoundError = new APIError(ErrorCode.NOT_FOUND, `Program with id ${id} not found`, {
        programId: id,
      });

      logError(notFoundError, { context: 'GET /api/programs/[id]', operation: 'fetch', id });

      return NextResponse.json(notFoundError.toResponse(), { status: 404 });
    }

    console.log(`[GET /api/programs/${id}] Found program: ${program.title}`);

    // 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: program,
        metadata: null,
      },
      { status: 200 }
    );
  } catch (error) {
    // 에러 로깅 (심각도별 자동 분류)
    logError(error, { context: 'GET /api/programs/[id]', operation: 'fetch' });

    // 표준 에러 응답 생성
    const errorResponse = createErrorResponse(error);

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
