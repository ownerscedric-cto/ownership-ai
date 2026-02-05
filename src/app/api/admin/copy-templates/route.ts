/**
 * @file /api/admin/copy-templates
 * @description 텍스트 복사 템플릿 관리 API (관리자용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// 템플릿 사용 용도 타입
const usageTypeEnum = z.enum(['customer', 'internal', 'all']);

// 템플릿 생성 스키마
const createTemplateSchema = z.object({
  name: z.string().min(1, '템플릿 이름을 입력해주세요').max(100),
  description: z.string().optional(),
  headerTemplate: z.string().optional(),
  itemTemplate: z.string().min(1, '아이템 템플릿을 입력해주세요'),
  footerTemplate: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
  usageType: usageTypeEnum.optional().default('all'),
});

/**
 * GET /api/admin/copy-templates
 * 템플릿 목록 조회 (관리자용 - 모든 템플릿)
 */
export async function GET() {
  try {
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

    // 모든 템플릿 조회 (관리자용이므로 RLS 우회)
    const { data: templates, error } = await supabase
      .from('copy_templates')
      .select('*')
      .order('sortOrder', { ascending: true });

    if (error) {
      console.error('[Copy Templates] GET error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: '템플릿 조회에 실패했습니다' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: templates,
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
 * POST /api/admin/copy-templates
 * 새 템플릿 생성
 */
export async function POST(request: NextRequest) {
  try {
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
    const validationResult = createTemplateSchema.safeParse(body);
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

    const templateData = validationResult.data;

    // 기본 템플릿으로 설정하는 경우, 기존 기본 템플릿 해제
    if (templateData.isDefault) {
      await supabase.from('copy_templates').update({ isDefault: false }).eq('isDefault', true);
    }

    // 템플릿 생성
    const { data: newTemplate, error } = await supabase
      .from('copy_templates')
      .insert({
        name: templateData.name,
        description: templateData.description || null,
        headerTemplate: templateData.headerTemplate || null,
        itemTemplate: templateData.itemTemplate,
        footerTemplate: templateData.footerTemplate || null,
        isDefault: templateData.isDefault,
        isActive: templateData.isActive,
        sortOrder: templateData.sortOrder,
        usageType: templateData.usageType,
      })
      .select()
      .single();

    if (error) {
      console.error('[Copy Templates] POST error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: '템플릿 생성에 실패했습니다' } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newTemplate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Copy Templates] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}
