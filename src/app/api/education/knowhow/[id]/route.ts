import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/education/knowhow/[id] - 노하우 상세 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const knowhow = await prisma.knowHow.findUnique({
      where: { id },
    });

    if (!knowhow) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'KNOWHOW_NOT_FOUND',
            message: 'KnowHow not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: knowhow,
    });
  } catch (error) {
    console.error(`GET /api/education/knowhow/[id] error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch knowhow',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/education/knowhow/[id] - 노하우 조회수 증가
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const knowhow = await prisma.knowHow.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      data: knowhow,
    });
  } catch (error) {
    console.error(`PATCH /api/education/knowhow/[id] error:`, error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'KNOWHOW_NOT_FOUND',
            message: 'KnowHow not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update view count',
        },
      },
      { status: 500 }
    );
  }
}
