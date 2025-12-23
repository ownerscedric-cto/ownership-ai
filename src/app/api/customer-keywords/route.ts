/**
 * @file /api/customer-keywords/route.ts
 * @description 고객 키워드 조회 API (공개용 - 고객 폼에서 사용)
 */

import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

/**
 * GET /api/customer-keywords
 * 활성화된 키워드 카테고리와 키워드 조회
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

    // 카테고리와 활성화된 키워드 함께 조회
    const { data: categories, error: categoriesError } = await supabase
      .from('customer_keyword_categories')
      .select(
        `
        id,
        name,
        displayName,
        color,
        order,
        keywords:customer_keywords (
          id,
          keyword,
          order
        )
      `
      )
      .eq('customer_keywords.isActive', true)
      .order('order', { ascending: true });

    if (categoriesError) {
      console.error('[GET /api/customer-keywords] Error:', categoriesError);
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
    });
  } catch (error) {
    console.error('[GET /api/customer-keywords] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '키워드 조회 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}
