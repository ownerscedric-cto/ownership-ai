import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

// 카테고리 타입 정의
interface KnowhowCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CategoryWithCount extends KnowhowCategory {
  _count: {
    posts: number;
    archives: number;
  };
  children?: CategoryWithCount[];
}

// GET /api/education/knowhow/categories - 카테고리 목록 조회 (계층형)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const flat = searchParams.get('flat') === 'true'; // flat=true이면 계층 없이 반환

    const { data: categories, error: categoriesError } = await supabase
      .from('knowhow_categories')
      .select('*')
      .order('order', { ascending: true });

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
    const categoriesWithCount: CategoryWithCount[] = await Promise.all(
      (categories || []).map(async (category: KnowhowCategory) => {
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

    // flat=true이면 계층화하지 않고 반환
    if (flat) {
      return successResponse(categoriesWithCount);
    }

    // 계층형 구조로 변환
    const rootCategories: CategoryWithCount[] = [];
    const categoryMap = new Map<string, CategoryWithCount>();

    // 먼저 모든 카테고리를 맵에 저장
    categoriesWithCount.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // 부모-자식 관계 설정
    categoriesWithCount.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(categoryWithChildren);
        } else {
          // 부모가 없으면 루트로 추가
          rootCategories.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return successResponse(rootCategories);
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
