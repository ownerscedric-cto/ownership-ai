import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Request Schema for POST
 */
const createCategorySchema = z.object({
  name: z.string().min(1, { message: '카테고리 이름을 입력해주세요' }),
  description: z.string().nullable().optional(),
  order: z.number().int().default(0),
  parentId: z.string().nullable().optional(), // 상위 카테고리 ID (null이면 대분류)
});

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

/**
 * GET /api/admin/education/knowhow/categories - 카테고리 목록 조회 (계층형)
 */
export async function GET(request: NextRequest) {
  // Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    // 카테고리 목록 조회 (order 순서대로)
    const { data: categories, error: categoriesError } = await supabase
      .from('knowhow_categories')
      .select('*')
      .order('order', { ascending: true });

    if (categoriesError) {
      console.error('카테고리 목록 조회 실패:', categoriesError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch categories',
            details: categoriesError.message,
          },
        },
        { status: 500 }
      );
    }

    // 각 카테고리별 게시글/아카이브 개수 조회
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

    return NextResponse.json({
      success: true,
      data: rootCategories,
    });
  } catch (error) {
    console.error('GET /api/admin/education/knowhow/categories error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch categories',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/education/knowhow/categories - 카테고리 생성
 */
export async function POST(request: NextRequest) {
  // Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    // Request body validation
    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // 카테고리 개수 제한 체크 (최대 30개 - 대분류 + 중분류 포함)
    const { count } = await supabase
      .from('knowhow_categories')
      .select('*', { count: 'exact', head: true });

    if (count && count >= 30) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CATEGORY_LIMIT_EXCEEDED',
            message: '카테고리는 최대 30개까지만 생성할 수 있습니다.',
          },
        },
        { status: 400 }
      );
    }

    // 중복 이름 체크
    const { data: existingCategory } = await supabase
      .from('knowhow_categories')
      .select('*')
      .eq('name', validatedData.name)
      .single();

    if (existingCategory) {
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

    // parentId가 지정된 경우 부모 카테고리 존재 확인
    if (validatedData.parentId) {
      const { data: parentCategory } = await supabase
        .from('knowhow_categories')
        .select('id')
        .eq('id', validatedData.parentId)
        .single();

      if (!parentCategory) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PARENT_CATEGORY_NOT_FOUND',
              message: '상위 카테고리를 찾을 수 없습니다.',
            },
          },
          { status: 404 }
        );
      }
    }

    // 카테고리 생성
    const { data: category, error: createError } = await supabase
      .from('knowhow_categories')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        order: validatedData.order ?? 0,
        parentId: validatedData.parentId ?? null,
      })
      .select()
      .single();

    if (createError) {
      console.error('카테고리 생성 실패:', createError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create category',
            details: createError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: category,
        message: '카테고리가 추가되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/education/knowhow/categories error:', error);

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
          message: 'Failed to create category',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
