/**
 * @file /api/admin/copy-templates/[id]
 * @description 단일 텍스트 복사 템플릿 관리 API (관리자용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// 템플릿 사용 용도 타입
const usageTypeEnum = z.enum(['customer', 'internal', 'all']);

// 템플릿 수정 스키마
const updateTemplateSchema = z.object({
  name: z.string().min(1, '템플릿 이름을 입력해주세요').max(100).optional(),
  description: z.string().optional().nullable(),
  headerTemplate: z.string().optional().nullable(),
  itemTemplate: z.string().min(1, '아이템 템플릿을 입력해주세요').optional(),
  footerTemplate: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  usageType: usageTypeEnum.optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/copy-templates/[id]
 * 단일 템플릿 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 관리자 권한 확인
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

    // 템플릿 조회
    const { data: template, error } = await supabase
      .from('copy_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '템플릿을 찾을 수 없습니다' } },
          { status: 404 }
        );
      }
      console.error('[Copy Templates] GET single error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: '템플릿 조회에 실패했습니다' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('[Copy Templates] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/copy-templates/[id]
 * 템플릿 수정
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 관리자 권한 확인
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

    const body = await request.json();

    // 입력 검증
    const validationResult = updateTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.error.issues[0]?.message || '입력값이 유효하지 않습니다',
          },
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // 기본 템플릿으로 설정하는 경우, 기존 기본 템플릿 해제
    if (updateData.isDefault === true) {
      await supabase
        .from('copy_templates')
        .update({ isDefault: false })
        .eq('isDefault', true)
        .neq('id', id);
    }

    // 템플릿 수정
    const { data: updatedTemplate, error } = await supabase
      .from('copy_templates')
      .update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '템플릿을 찾을 수 없습니다' } },
          { status: 404 }
        );
      }
      console.error('[Copy Templates] PATCH error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: '템플릿 수정에 실패했습니다' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTemplate,
    });
  } catch (error) {
    console.error('[Copy Templates] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/copy-templates/[id]
 * 템플릿 삭제
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 관리자 권한 확인
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

    // 삭제하려는 템플릿이 기본 템플릿인지 확인
    const { data: template, error: checkError } = await supabase
      .from('copy_templates')
      .select('isDefault')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '템플릿을 찾을 수 없습니다' } },
          { status: 404 }
        );
      }
      console.error('[Copy Templates] DELETE check error:', checkError);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: '템플릿 조회에 실패했습니다' } },
        { status: 500 }
      );
    }

    if (template?.isDefault) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CANNOT_DELETE_DEFAULT', message: '기본 템플릿은 삭제할 수 없습니다' },
        },
        { status: 400 }
      );
    }

    // 템플릿 삭제
    const { error: deleteError } = await supabase.from('copy_templates').delete().eq('id', id);

    if (deleteError) {
      console.error('[Copy Templates] DELETE error:', deleteError);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: '템플릿 삭제에 실패했습니다' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: '템플릿이 삭제되었습니다' },
    });
  } catch (error) {
    console.error('[Copy Templates] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}
