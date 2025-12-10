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

    let query = supabase.from('knowhow').select('*', { count: 'exact' });

    // WHERE 조건
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // 정렬
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy === 'viewCount' ? 'view_count' : sortBy;
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

    // camelCase 변환
    const formattedKnowHows = (knowhows || []).map((knowhow) => ({
      id: knowhow.id,
      title: knowhow.title,
      content: knowhow.content,
      category: knowhow.category,
      author: knowhow.author,
      tags: knowhow.tags,
      viewCount: knowhow.view_count,
      createdAt: knowhow.created_at,
      updatedAt: knowhow.updated_at,
    }));

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

    const { data: knowhow, error: createError } = await supabase
      .from('knowhow')
      .insert({
        title: validated.title,
        content: validated.content,
        category: validated.category,
        author: validated.author,
        tags: validated.tags || [],
      })
      .select('*')
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

    // camelCase 변환
    const formattedKnowHow = {
      id: knowhow.id,
      title: knowhow.title,
      content: knowhow.content,
      category: knowhow.category,
      author: knowhow.author,
      tags: knowhow.tags,
      viewCount: knowhow.view_count,
      createdAt: knowhow.created_at,
      updatedAt: knowhow.updated_at,
    };

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
