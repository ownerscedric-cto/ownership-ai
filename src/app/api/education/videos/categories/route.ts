import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/education/videos/categories - Public 비디오 카테고리 목록 조회
 * Admin 인증 불필요 (Public API)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 카테고리 목록 조회 (order 순서대로)
    const { data: categories, error: categoriesError } = await supabase
      .from('video_categories')
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

    return NextResponse.json({
      success: true,
      data: categories || [],
    });
  } catch (error) {
    console.error('GET /api/education/videos/categories error:', error);

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
