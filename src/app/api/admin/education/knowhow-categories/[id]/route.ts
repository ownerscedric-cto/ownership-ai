import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  updateKnowHowCategorySchema,
  type UpdateKnowHowCategoryInput,
} from '@/lib/validations/education';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/education/knowhow-categories/[id] - 노하우 카테고리 상세 조회
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. 카테고리 조회
    const { data: category, error: categoryError } = await supabase
      .from('knowhow_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (categoryError || !category) {
      return errorResponse(ErrorCode.NOT_FOUND, '카테고리를 찾을 수 없습니다', null, 404);
    }

    // 2. 게시글 수 조회
    const { count } = await supabase
      .from('knowhow_posts')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    const categoryWithCount = {
      ...category,
      _count: {
        posts: count || 0,
      },
    };

    // 3. 성공 응답
    return successResponse(categoryWithCount);
  } catch (error) {
    console.error('KnowHow category detail error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '카테고리 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}

// PATCH /api/admin/education/knowhow-categories/[id] - 노하우 카테고리 수정 (관리자 전용)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. 요청 바디 파싱
    const body = await request.json();

    // 3. 유효성 검증 (Zod)
    const validatedData: UpdateKnowHowCategoryInput = updateKnowHowCategorySchema.parse(body);

    // 4. 카테고리 존재 여부 확인
    const { data: existingCategory } = await supabase
      .from('knowhow_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingCategory) {
      return errorResponse(ErrorCode.NOT_FOUND, '카테고리를 찾을 수 없습니다', null, 404);
    }

    // 5. 이름 중복 체크 (다른 카테고리와 중복되는지)
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const { data: duplicateCategory } = await supabase
        .from('knowhow_categories')
        .select('*')
        .eq('name', validatedData.name)
        .single();

      if (duplicateCategory) {
        return errorResponse(
          ErrorCode.VALIDATION_ERROR,
          '이미 존재하는 카테고리 이름입니다',
          null,
          400
        );
      }
    }

    // 6. 카테고리 수정
    const { data: updatedCategory, error: updateError } = await supabase
      .from('knowhow_categories')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('카테고리 수정 실패:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '카테고리 수정에 실패했습니다', null, 500);
    }

    // 7. 성공 응답
    return successResponse(updatedCategory);
  } catch (error) {
    // Zod 유효성 검증 에러
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력 데이터가 유효하지 않습니다',
        error.issues,
        400
      );
    }

    // 서버 에러
    console.error('KnowHow category update error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '카테고리 수정 중 오류가 발생했습니다',
      null,
      500
    );
  }
}

// DELETE /api/admin/education/knowhow-categories/[id] - 노하우 카테고리 삭제 (관리자 전용)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. 카테고리 존재 여부 확인
    const { data: existingCategory } = await supabase
      .from('knowhow_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingCategory) {
      return errorResponse(ErrorCode.NOT_FOUND, '카테고리를 찾을 수 없습니다', null, 404);
    }

    // 3. 게시글 수 확인
    const { count } = await supabase
      .from('knowhow_posts')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    // 4. 게시글이 있는 카테고리는 삭제 불가
    if (count && count > 0) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '게시글이 있는 카테고리는 삭제할 수 없습니다',
        { postCount: count },
        400
      );
    }

    // 5. 카테고리 삭제
    const { error: deleteError } = await supabase
      .from('knowhow_categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('카테고리 삭제 실패:', deleteError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '카테고리 삭제에 실패했습니다', null, 500);
    }

    // 6. 성공 응답 (204 No Content)
    return new Response(null, { status: 204 });
  } catch (error) {
    // 서버 에러
    console.error('KnowHow category delete error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '카테고리 삭제 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
