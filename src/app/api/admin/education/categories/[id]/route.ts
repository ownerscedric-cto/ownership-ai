import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();

    // 카테고리 존재 확인
    const { data: existingCategory } = await supabase
      .from('video_categories')
      .select('*')
      .eq('id', id)
      .single();

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
      const { data: duplicateCategory } = await supabase
        .from('video_categories')
        .select('*')
        .eq('name', validatedData.name)
        .single();

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
    const { data: updatedCategory, error: updateError } = await supabase
      .from('video_categories')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('카테고리 수정 실패:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update category',
            details: updateError.message,
          },
        },
        { status: 500 }
      );
    }

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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Admin 권한 체크
  const authResult = await requireAdmin(_request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const supabase = await createClient();

    // 카테고리 존재 확인
    const { data: category } = await supabase
      .from('video_categories')
      .select('*')
      .eq('id', id)
      .single();

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

    // 카테고리에 연결된 비디오 개수 확인
    const { count } = await supabase
      .from('education_videos')
      .select('*', { count: 'exact', head: true })
      .eq('category', category.name);

    // 카테고리에 연결된 비디오가 있으면 삭제 불가
    if (count && count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CATEGORY_IN_USE',
            message: '이 카테고리를 사용하는 비디오가 있어 삭제할 수 없습니다.',
            details: {
              videoCount: count,
            },
          },
        },
        { status: 409 }
      );
    }

    // 카테고리 삭제
    const { error: deleteError } = await supabase
      .from('video_categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('카테고리 삭제 실패:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete category',
            details: deleteError.message,
          },
        },
        { status: 500 }
      );
    }

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
