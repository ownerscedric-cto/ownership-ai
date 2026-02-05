/**
 * @file /api/admin/template-variables/[id]
 * @description 템플릿 변수 단일 관리 API (관리자용)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// 변수 수정 스키마
const updateVariableSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  value: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 단일 변수 조회
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    const { data, error } = await supabase
      .from('template_variables')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '변수를 찾을 수 없습니다' } },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Admin Template Variable] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}

// PATCH: 변수 수정
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // 시스템 변수인지 확인
    const { data: existingVar } = await supabase
      .from('template_variables')
      .select('isSystem')
      .eq('id', id)
      .single();

    if (existingVar?.isSystem) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: '시스템 변수는 수정할 수 없습니다' },
        },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const validationResult = updateVariableSchema.safeParse(body);

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

    const updateData = {
      ...validationResult.data,
      updatedAt: new Date().toISOString(),
    };

    // RLS가 관리자 권한 체크
    const { data, error } = await supabase
      .from('template_variables')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '변수를 찾을 수 없습니다' } },
          { status: 404 }
        );
      }
      // RLS 정책에 의한 권한 거부
      if (error.code === '42501') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다' } },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Admin Template Variable] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}

// DELETE: 변수 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // 시스템 변수인지 확인
    const { data: existingVar } = await supabase
      .from('template_variables')
      .select('isSystem')
      .eq('id', id)
      .single();

    if (existingVar?.isSystem) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: '시스템 변수는 삭제할 수 없습니다' },
        },
        { status: 403 }
      );
    }

    // RLS가 관리자 권한 체크
    const { error } = await supabase.from('template_variables').delete().eq('id', id);

    if (error) {
      // RLS 정책에 의한 권한 거부
      if (error.code === '42501') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다' } },
          { status: 403 }
        );
      }
      console.error('[Admin Template Variable] Delete error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Admin Template Variable] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}
