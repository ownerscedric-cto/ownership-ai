/**
 * @file /api/admin/settings/keywords/[id]/route.ts
 * @description 개별 키워드 수정/삭제 API
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { updateKeywordSchema } from '@/lib/validations/keyword';
import { requireAdminRole } from '@/lib/auth/roles';
import { ZodError } from 'zod';

/**
 * PATCH /api/admin/settings/keywords/[id]
 * 키워드 수정
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

    // 키워드 존재 확인
    const { data: existingKeyword, error: findError } = await supabase
      .from('customer_keywords')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existingKeyword) {
      return errorResponse(ErrorCode.NOT_FOUND, '키워드를 찾을 수 없습니다', null, 404);
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validatedData = updateKeywordSchema.parse(body);

    // 카테고리 변경 시 카테고리 존재 확인
    if (validatedData.categoryId && validatedData.categoryId !== existingKeyword.categoryId) {
      const { data: category, error: categoryError } = await supabase
        .from('customer_keyword_categories')
        .select('id')
        .eq('id', validatedData.categoryId)
        .single();

      if (categoryError || !category) {
        return errorResponse(ErrorCode.NOT_FOUND, '해당 카테고리를 찾을 수 없습니다', null, 404);
      }
    }

    // 키워드 이름 변경 시 중복 체크
    if (validatedData.keyword && validatedData.keyword !== existingKeyword.keyword) {
      const targetCategoryId = validatedData.categoryId || existingKeyword.categoryId;
      const { data: duplicate } = await supabase
        .from('customer_keywords')
        .select('id')
        .eq('categoryId', targetCategoryId)
        .eq('keyword', validatedData.keyword)
        .neq('id', id)
        .single();

      if (duplicate) {
        return errorResponse(ErrorCode.DUPLICATE_ENTRY, '이미 존재하는 키워드입니다', null, 409);
      }
    }

    // 키워드 수정
    const { data: updatedKeyword, error: updateError } = await supabase
      .from('customer_keywords')
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[PATCH /api/admin/settings/keywords/[id]] Update error:', updateError);
      return errorResponse(
        ErrorCode.DATABASE_ERROR,
        '키워드 수정 중 오류가 발생했습니다',
        updateError.message,
        500
      );
    }

    return successResponse(updatedKeyword);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.INVALID_INPUT,
        '입력 데이터가 올바르지 않습니다',
        error.issues,
        400
      );
    }

    console.error('[PATCH /api/admin/settings/keywords/[id]] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '키워드 수정 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}

/**
 * DELETE /api/admin/settings/keywords/[id]
 * 키워드 삭제
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

    // 키워드 존재 확인
    const { data: existingKeyword, error: findError } = await supabase
      .from('customer_keywords')
      .select('id, keyword')
      .eq('id', id)
      .single();

    if (findError || !existingKeyword) {
      return errorResponse(ErrorCode.NOT_FOUND, '키워드를 찾을 수 없습니다', null, 404);
    }

    // 키워드 삭제
    const { error: deleteError } = await supabase.from('customer_keywords').delete().eq('id', id);

    if (deleteError) {
      console.error('[DELETE /api/admin/settings/keywords/[id]] Delete error:', deleteError);
      return errorResponse(
        ErrorCode.DATABASE_ERROR,
        '키워드 삭제 중 오류가 발생했습니다',
        deleteError.message,
        500
      );
    }

    return successResponse({ id, keyword: existingKeyword.keyword });
  } catch (error) {
    console.error('[DELETE /api/admin/settings/keywords/[id]] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '키워드 삭제 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}
