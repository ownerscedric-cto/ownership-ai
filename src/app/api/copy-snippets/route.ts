/**
 * @file /api/copy-snippets
 * @description 스니펫 조회 API (사용자용)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 활성화된 스니펫 목록 조회
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
        { status: 401 }
      );
    }

    // 쿼리 빌드
    let query = supabase
      .from('copy_snippets')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder', { ascending: true });

    // 카테고리 필터
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Copy Snippets] Error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Copy Snippets] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}
