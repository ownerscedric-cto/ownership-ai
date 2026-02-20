import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

// 설정 업데이트 스키마
const updateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
    })
  ),
});

/**
 * GET /api/admin/settings - 모든 사이트 설정 조회 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  // Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DB_ERROR',
            message: '설정 조회에 실패했습니다.',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('GET /api/admin/settings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '설정 조회 중 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings - 사이트 설정 업데이트 (관리자 전용)
 */
export async function PATCH(request: NextRequest) {
  // Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const validationResult = updateSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력값이 올바르지 않습니다.',
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { settings } = validationResult.data;

    // 각 설정을 업데이트
    const updatePromises = settings.map(({ key, value }) =>
      supabaseAdmin.from('site_settings').update({ value }).eq('key', key).select().single()
    );

    const results = await Promise.allSettled(updatePromises);

    // 실패한 업데이트 확인
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some settings failed to update:', failures);
    }

    // 업데이트된 설정 조회
    const { data: updatedSettings, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DB_ERROR',
            message: '설정 업데이트 후 조회에 실패했습니다.',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: '설정이 업데이트되었습니다.',
    });
  } catch (error) {
    console.error('PATCH /api/admin/settings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '설정 업데이트 중 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
