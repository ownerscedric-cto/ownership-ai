/**
 * @file /api/admin/settings/keyword-categories/route.ts
 * @description 키워드 카테고리 CRUD API
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { createKeywordCategorySchema } from '@/lib/validations/keyword';
import { requireAdminRole } from '@/lib/auth/roles';
import { ZodError } from 'zod';

// 최대 카테고리 수 제한
const MAX_CATEGORIES = 10;

/**
 * GET /api/admin/settings/keyword-categories
 * 모든 키워드 카테고리 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 카테고리 조회
    const { data: categories, error: categoriesError } = await supabase
      .from('customer_keyword_categories')
      .select('*')
      .order('order', { ascending: true });

    if (categoriesError) {
      console.error('[GET /api/admin/settings/keyword-categories] Error:', categoriesError);
      return errorResponse(
        ErrorCode.DATABASE_ERROR,
        '카테고리 조회 중 오류가 발생했습니다',
        categoriesError.message,
        500
      );
    }

    return successResponse({
      categories: categories || [],
      maxCategories: MAX_CATEGORIES,
    });
  } catch (error) {
    console.error('[GET /api/admin/settings/keyword-categories] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '카테고리 조회 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}

/**
 * POST /api/admin/settings/keyword-categories
 * 새 키워드 카테고리 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 체크
    const authResult = await requireAdminRole(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const supabase = await createClient();

    // 현재 카테고리 수 체크
    const { count } = await supabase
      .from('customer_keyword_categories')
      .select('*', { count: 'exact', head: true });

    if ((count || 0) >= MAX_CATEGORIES) {
      return errorResponse(
        ErrorCode.BAD_REQUEST,
        `카테고리는 최대 ${MAX_CATEGORIES}개까지 생성 가능합니다`,
        null,
        400
      );
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validatedData = createKeywordCategorySchema.parse(body);

    // 중복 이름 체크
    const { data: existing } = await supabase
      .from('customer_keyword_categories')
      .select('id')
      .eq('name', validatedData.name)
      .single();

    if (existing) {
      return errorResponse(
        ErrorCode.DUPLICATE_ENTRY,
        '이미 존재하는 카테고리 이름입니다',
        null,
        409
      );
    }

    // 현재 최대 order 값 조회
    const { data: maxOrderResult } = await supabase
      .from('customer_keyword_categories')
      .select('order')
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = validatedData.order ?? (maxOrderResult?.order || 0) + 1;

    // 카테고리 생성
    const { data: newCategory, error: insertError } = await supabase
      .from('customer_keyword_categories')
      .insert({
        name: validatedData.name,
        displayName: validatedData.displayName,
        color: validatedData.color,
        order: nextOrder,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/admin/settings/keyword-categories] Insert error:', insertError);
      return errorResponse(
        ErrorCode.DATABASE_ERROR,
        '카테고리 생성 중 오류가 발생했습니다',
        insertError.message,
        500
      );
    }

    return successResponse(newCategory);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.INVALID_INPUT,
        '입력 데이터가 올바르지 않습니다',
        error.issues,
        400
      );
    }

    console.error('[POST /api/admin/settings/keyword-categories] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '카테고리 생성 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}
