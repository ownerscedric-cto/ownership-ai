/**
 * @file /api/admin/template-variables
 * @description 템플릿 변수 관리 API (관리자용)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// 변수 생성 스키마
const createVariableSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, {
      message: '변수명은 영문자로 시작하고 영문자/숫자만 사용 가능합니다',
    }),
  displayName: z.string().min(1).max(100),
  value: z.string().min(1),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// GET: 모든 변수 목록 조회 (관리자용)
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

    // 모든 변수 조회 (시스템 변수 포함)
    const { data, error } = await supabase
      .from('template_variables')
      .select('*')
      .order('isSystem', { ascending: false })
      .order('sortOrder', { ascending: true });

    if (error) {
      console.error('[Admin Template Variables] Error:', error);
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
    console.error('[Admin Template Variables] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}

// POST: 새 변수 생성
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
    const validationResult = createVariableSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.error.issues[0]?.message || '입력값이 올바르지 않습니다',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // 중복 변수명 체크
    const { data: existing } = await supabase
      .from('template_variables')
      .select('id')
      .eq('name', validationResult.data.name)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE_NAME', message: '이미 존재하는 변수명입니다' },
        },
        { status: 409 }
      );
    }

    // RLS가 관리자 권한 체크
    const { data, error } = await supabase
      .from('template_variables')
      .insert({
        ...validationResult.data,
        isSystem: false, // 사용자 생성 변수는 항상 커스텀
      })
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
      console.error('[Admin Template Variables] Insert error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('[Admin Template Variables] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}
