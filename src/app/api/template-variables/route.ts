/**
 * @file /api/template-variables
 * @description 템플릿 변수 조회 API (사용자용)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 활성화된 변수 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();

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

    // 활성화된 변수만 조회
    const { data, error } = await supabase
      .from('template_variables')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder', { ascending: true });

    if (error) {
      console.error('[Template Variables] Error:', error);
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
    console.error('[Template Variables] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}
