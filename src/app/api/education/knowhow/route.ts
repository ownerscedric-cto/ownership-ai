import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createKnowHowSchema, knowHowFilterSchema } from '@/lib/validations/education';
import { z } from 'zod';

/**
 * GET /api/education/knowhow - 노하우 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const filters = knowHowFilterSchema.parse(searchParams);

    const { page, limit, sortBy, sortOrder, category, search } = filters;
    const supabase = await createClient();

    // knowhow_categories와 JOIN
    let query = supabase.from('knowhow').select(
      `
        *,
        category:knowhow_categories!knowhow_categoryid_fkey(*)
      `,
      { count: 'exact' }
    );

    // WHERE 조건
    if (category) {
      query = query.eq('categoryId', category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // 정렬 (Supabase 테이블이 camelCase 사용)
    const sortColumn = sortBy === 'viewCount' ? 'viewCount' : sortBy;
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: knowhows, error: knowhowsError, count } = await query;

    if (knowhowsError) {
      console.error('노하우 목록 조회 실패:', knowhowsError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch knowhow list',
          },
        },
        { status: 500 }
      );
    }

    // Supabase 테이블이 이미 camelCase이므로 변환 불필요
    const formattedKnowHows = knowhows || [];

    return NextResponse.json({
      success: true,
      data: formattedKnowHows,
      metadata: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/education/knowhow error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
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
          message: 'Failed to fetch knowhow list',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/education/knowhow - 노하우 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createKnowHowSchema.parse(body);
    const supabase = await createClient();

    // UUID 명시적 생성 (Supabase 기본값 처리 이슈 방지)
    const { data: uuidData } = await supabase.rpc('gen_random_uuid');
    const newId = uuidData || crypto.randomUUID();

    const now = new Date().toISOString();

    // Get category name if categoryId is provided
    let categoryName = '';
    if (validated.categoryId) {
      const { data: categoryData } = await supabase
        .from('knowhow_categories')
        .select('name')
        .eq('id', validated.categoryId)
        .single();
      categoryName = categoryData?.name || '';
    }

    const { data: knowhow, error: createError } = await supabase
      .from('knowhow')
      .insert({
        id: newId,
        title: validated.title,
        content: validated.content,
        category: categoryName || '일반', // category 컬럼 (텍스트) - NOT NULL 제약
        categoryId: validated.categoryId,
        author: validated.author,
        tags: validated.tags || [],
        imageUrls: validated.imageUrls || [],
        fileUrls: validated.fileUrls || [],
        fileNames: validated.fileNames || [],
        createdAt: now,
        updatedAt: now,
      })
      .select(
        `
        *,
        category:knowhow_categories!knowhow_categoryid_fkey(*)
      `
      )
      .single();

    if (createError) {
      console.error('노하우 생성 실패:', createError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create knowhow',
          },
        },
        { status: 500 }
      );
    }

    // Supabase 테이블이 이미 camelCase이므로 변환 불필요
    const formattedKnowHow = knowhow;

    return NextResponse.json(
      {
        success: true,
        data: formattedKnowHow,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/education/knowhow error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
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
          message: 'Failed to create knowhow',
        },
      },
      { status: 500 }
    );
  }
}
