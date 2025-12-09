import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Request Schema for POST
 */
const createCategorySchema = z.object({
  name: z.string().min(1, { message: '카테고리 이름을 입력해주세요' }),
  description: z.string().nullable().optional(),
  order: z.number().int().default(0),
});

/**
 * GET /api/admin/education/categories - 카테고리 목록 조회
 */
export async function GET(request: NextRequest) {
  // Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    // 카테고리 목록 조회 (order 순서대로)
    const categories = await prisma.videoCategory.findMany({
      orderBy: {
        order: 'asc',
      },
      include: {
        _count: {
          select: {
            videos: true, // 각 카테고리의 비디오 개수
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('GET /api/admin/education/categories error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch categories',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/education/categories - 카테고리 생성
 */
export async function POST(request: NextRequest) {
  // Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    // Request body validation
    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // 카테고리 개수 제한 체크 (최대 10개)
    const categoryCount = await prisma.videoCategory.count();
    if (categoryCount >= 10) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CATEGORY_LIMIT_EXCEEDED',
            message: '카테고리는 최대 10개까지만 생성할 수 있습니다.',
          },
        },
        { status: 400 }
      );
    }

    // 중복 이름 체크
    const existingCategory = await prisma.videoCategory.findUnique({
      where: { name: validatedData.name },
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CATEGORY',
            message: '이미 존재하는 카테고리 이름입니다.',
          },
        },
        { status: 409 }
      );
    }

    // 카테고리 생성
    const category = await prisma.videoCategory.create({
      data: validatedData,
    });

    return NextResponse.json(
      {
        success: true,
        data: category,
        message: '카테고리가 추가되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/education/categories error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid request body',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create category',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
