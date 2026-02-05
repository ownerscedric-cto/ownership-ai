/**
 * @file /api/admin/copy-snippets
 * @description 스니펫 관리 API (관리자용)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// 스니펫 생성 스키마
const createSnippetSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(100),
  content: z.string().min(1, '내용을 입력해주세요'),
  category: z.string().max(50).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// GET: 모든 스니펫 목록 조회 (관리자용)
export async function GET() {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
        { status: 401 }
      );
    }

    // RLS가 관리자 권한 체크 (모든 스니펫 조회)
    const { data, error } = await supabase
      .from('copy_snippets')
      .select('*')
      .order('sortOrder', { ascending: true });

    if (error) {
      console.error('[Admin Snippets] Error:', error);
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
    console.error('[Admin Snippets] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}

// POST: 스니펫 생성
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const validationResult = createSnippetSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력값이 올바르지 않습니다',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // RLS가 관리자 권한 체크
    const { data, error } = await supabase
      .from('copy_snippets')
      .insert(validationResult.data)
      .select()
      .single();

    if (error) {
      // RLS 정책에 의한 권한 거부
      if (error.code === '42501') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다' } },
          { status: 403 }
        );
      }
      console.error('[Admin Snippets] Create error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('[Admin Snippets] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}
