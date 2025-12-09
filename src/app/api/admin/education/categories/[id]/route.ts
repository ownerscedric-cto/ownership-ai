import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Request Schema for PATCH
 */
const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  order: z.number().int().optional(),
});

/**
 * PATCH /api/admin/education/categories/[id] - 카테고리 수정
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    // 카테고리 존재 확인
    const existingCategory = await prisma.videoCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        },
        { status: 404 }
      );
    }

    // Request body validation
    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    // 이름 변경 시 중복 체크
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await prisma.videoCategory.findUnique({
        where: { name: validatedData.name },
      });

      if (duplicateCategory) {
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
    }

    // 카테고리 업데이트
    const updatedCategory = await prisma.videoCategory.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: '카테고리가 수정되었습니다.',
    });
  } catch (error) {
    console.error('PATCH /api/admin/education/categories/[id] error:', error);

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
          message: 'Failed to update category',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/education/categories/[id] - 카테고리 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    // 카테고리 존재 확인
    const category = await prisma.videoCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        },
        { status: 404 }
      );
    }

    // 카테고리에 연결된 비디오가 있으면 삭제 불가
    if (category._count.videos > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CATEGORY_IN_USE',
            message: '이 카테고리를 사용하는 비디오가 있어 삭제할 수 없습니다.',
            details: {
              videoCount: category._count.videos,
            },
          },
        },
        { status: 409 }
      );
    }

    // 카테고리 삭제
    await prisma.videoCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '카테고리가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/education/categories/[id] error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete category',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
