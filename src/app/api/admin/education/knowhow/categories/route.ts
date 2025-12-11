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
});

/**
 * GET /api/admin/education/knowhow/categories - 카테고리 목록 조회
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

    // 각 카테고리별 노하우 개수 조회
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async category => {
        const { count } = await supabase
          .from('knowhow')
          .select('*', { count: 'exact', head: true })
          .eq('categoryId', category.id);

        return {
          ...category,
          _count: {
            knowhows: count || 0,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: categoriesWithCount,
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

    // 카테고리 개수 제한 체크 (최대 10개)
    const { count } = await supabase
      .from('knowhow_categories')
      .select('*', { count: 'exact', head: true });

    if (count && count >= 10) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CATEGORY_LIMIT_EXCEEDED',
            message: '카테고리는 최대 10개까지만 생성할 수 있습니다.',
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

    // 카테고리 생성
    const { data: category, error: createError } = await supabase
      .from('knowhow_categories')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        order: validatedData.order ?? 0,
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
