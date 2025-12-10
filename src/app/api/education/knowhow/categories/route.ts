import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

// GET /api/education/knowhow/categories - 카테고리 목록 조회
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: categories, error: categoriesError } = await supabase
      .from('knowhow_categories')
      .select('*')
      .order('id', { ascending: true });

    if (categoriesError) {
      console.error('카테고리 조회 실패:', categoriesError);
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        '카테고리 목록 조회에 실패했습니다',
        null,
        500
      );
    }

    return successResponse(categories || []);
  } catch (error) {
    console.error('KnowHow category list error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '카테고리 목록 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
