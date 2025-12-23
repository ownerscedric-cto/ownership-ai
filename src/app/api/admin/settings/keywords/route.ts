/**
 * @file /api/admin/settings/keywords/route.ts
 * @description 키워드 카테고리 및 키워드 조회/생성 API
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { createKeywordSchema } from '@/lib/validations/keyword';
import { requireAdminRole } from '@/lib/auth/roles';
import { ZodError } from 'zod';

/**
 * GET /api/admin/settings/keywords
 * 모든 키워드 카테고리와 키워드 조회
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

    // 카테고리와 키워드 함께 조회
    const { data: categories, error: categoriesError } = await supabase
      .from('customer_keyword_categories')
      .select(
        `
        id,
        name,
        displayName,
        color,
        order,
        createdAt,
        updatedAt,
        keywords:customer_keywords (
          id,
          keyword,
          order,
          isActive,
          createdAt,
          updatedAt
        )
      `
      )
      .order('order', { ascending: true });

    if (categoriesError) {
      console.error('[GET /api/admin/settings/keywords] Error:', categoriesError);
      return errorResponse(
        ErrorCode.DATABASE_ERROR,
        '키워드 조회 중 오류가 발생했습니다',
        categoriesError.message,
        500
      );
    }

    // 각 카테고리 내 키워드 정렬
    const sortedCategories = categories?.map(category => ({
      ...category,
      keywords: (category.keywords || []).sort(
        (a: { order: number }, b: { order: number }) => a.order - b.order
      ),
    }));

    return successResponse({
      categories: sortedCategories || [],
      totalKeywords: sortedCategories?.reduce((sum, cat) => sum + (cat.keywords?.length || 0), 0),
    });
  } catch (error) {
    console.error('[GET /api/admin/settings/keywords] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '키워드 조회 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}

/**
 * POST /api/admin/settings/keywords
 * 새 키워드 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 체크
    const authResult = await requireAdminRole(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const supabase = await createClient();

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validatedData = createKeywordSchema.parse(body);

    // 카테고리 존재 확인
    const { data: category, error: categoryError } = await supabase
      .from('customer_keyword_categories')
      .select('id')
      .eq('id', validatedData.categoryId)
      .single();

    if (categoryError || !category) {
      return errorResponse(ErrorCode.NOT_FOUND, '해당 카테고리를 찾을 수 없습니다', null, 404);
    }

    // 중복 키워드 체크
    const { data: existing } = await supabase
      .from('customer_keywords')
      .select('id')
      .eq('categoryId', validatedData.categoryId)
      .eq('keyword', validatedData.keyword)
      .single();

    if (existing) {
      return errorResponse(ErrorCode.DUPLICATE_ENTRY, '이미 존재하는 키워드입니다', null, 409);
    }

    // 현재 최대 order 값 조회
    const { data: maxOrderResult } = await supabase
      .from('customer_keywords')
      .select('order')
      .eq('categoryId', validatedData.categoryId)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = validatedData.order ?? (maxOrderResult?.order || 0) + 1;

    // 키워드 생성
    const { data: newKeyword, error: insertError } = await supabase
      .from('customer_keywords')
      .insert({
        categoryId: validatedData.categoryId,
        keyword: validatedData.keyword,
        order: nextOrder,
        isActive: validatedData.isActive ?? true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/admin/settings/keywords] Insert error:', insertError);
      return errorResponse(
        ErrorCode.DATABASE_ERROR,
        '키워드 생성 중 오류가 발생했습니다',
        insertError.message,
        500
      );
    }

    return successResponse(newKeyword);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.INVALID_INPUT,
        '입력 데이터가 올바르지 않습니다',
        error.issues,
        400
      );
    }

    console.error('[POST /api/admin/settings/keywords] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '키워드 생성 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}
