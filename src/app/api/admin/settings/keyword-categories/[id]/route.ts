/**
 * @file /api/admin/settings/keyword-categories/[id]/route.ts
 * @description 개별 키워드 카테고리 수정/삭제 API
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { updateKeywordCategorySchema } from '@/lib/validations/keyword';
import { requireAdminRole } from '@/lib/auth/roles';
import { ZodError } from 'zod';

/**
 * PATCH /api/admin/settings/keyword-categories/[id]
 * 카테고리 수정
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 관리자 권한 체크
    const authResult = await requireAdminRole(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const supabase = await createClient();

    // 카테고리 존재 확인
    const { data: existingCategory, error: findError } = await supabase
      .from('customer_keyword_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existingCategory) {
      return errorResponse(ErrorCode.NOT_FOUND, '카테고리를 찾을 수 없습니다', null, 404);
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validatedData = updateKeywordCategorySchema.parse(body);

    // 카테고리 수정
    const { data: updatedCategory, error: updateError } = await supabase
      .from('customer_keyword_categories')
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error(
        '[PATCH /api/admin/settings/keyword-categories/[id]] Update error:',
        updateError
      );
      return errorResponse(
        ErrorCode.DATABASE_ERROR,
        '카테고리 수정 중 오류가 발생했습니다',
        updateError.message,
        500
      );
    }

    return successResponse(updatedCategory);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.INVALID_INPUT,
        '입력 데이터가 올바르지 않습니다',
        error.issues,
        400
      );
    }

    console.error('[PATCH /api/admin/settings/keyword-categories/[id]] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '카테고리 수정 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}

/**
 * DELETE /api/admin/settings/keyword-categories/[id]
 * 카테고리 삭제 (카테고리 내 키워드도 함께 삭제됨 - CASCADE)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 관리자 권한 체크
    const authResult = await requireAdminRole(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const supabase = await createClient();

    // 카테고리 존재 확인
    const { data: existingCategory, error: findError } = await supabase
      .from('customer_keyword_categories')
      .select('id, name, displayName')
      .eq('id', id)
      .single();

    if (findError || !existingCategory) {
      return errorResponse(ErrorCode.NOT_FOUND, '카테고리를 찾을 수 없습니다', null, 404);
    }

    // 카테고리 내 키워드 수 조회 (경고용)
    const { count: keywordCount } = await supabase
      .from('customer_keywords')
      .select('*', { count: 'exact', head: true })
      .eq('categoryId', id);

    // 카테고리 삭제 (CASCADE로 키워드도 함께 삭제)
    const { error: deleteError } = await supabase
      .from('customer_keyword_categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error(
        '[DELETE /api/admin/settings/keyword-categories/[id]] Delete error:',
        deleteError
      );
      return errorResponse(
        ErrorCode.DATABASE_ERROR,
        '카테고리 삭제 중 오류가 발생했습니다',
        deleteError.message,
        500
      );
    }

    return successResponse({
      id,
      name: existingCategory.name,
      displayName: existingCategory.displayName,
      deletedKeywords: keywordCount || 0,
    });
  } catch (error) {
    console.error('[DELETE /api/admin/settings/keyword-categories/[id]] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '카테고리 삭제 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}
