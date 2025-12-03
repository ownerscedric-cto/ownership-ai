/**
 * @file /api/programs/[id]/route.ts
 * @description 정부지원사업 프로그램 상세 조회 API
 * Phase 3: 다중 API 통합 연동
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    console.log(`[GET /api/programs/${id}] Fetching program details...`);

    // 프로그램 조회
    const program = await prisma.program.findUnique({
      where: { id },
    });

    // 프로그램이 없으면 404 반환
    if (!program) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Program with id ${id} not found`,
            details: null,
          },
        },
        { status: 404 }
      );
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
    console.error(`[GET /api/programs/[id]] Error fetching program:`, error);

    // 에러 응답
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch program',
          details: error instanceof Error ? error.stack : null,
        },
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
