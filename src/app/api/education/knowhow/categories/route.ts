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

    // 각 카테고리별 개수 조회 (커뮤니티 게시글 + 아카이브)
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async category => {
        // 커뮤니티 게시글 개수 (knowhow_posts)
        const { count: postsCount } = await supabase
          .from('knowhow_posts')
          .select('*', { count: 'exact', head: true })
          .eq('categoryId', category.id);

        // 아카이브 개수 (knowhow)
        const { count: archiveCount } = await supabase
          .from('knowhow')
          .select('*', { count: 'exact', head: true })
          .eq('categoryId', category.id);

        return {
          ...category,
          _count: {
            posts: postsCount || 0,
            archives: archiveCount || 0,
          },
        };
      })
    );

    return successResponse(categoriesWithCount);
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
