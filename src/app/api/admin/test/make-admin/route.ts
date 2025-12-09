import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/admin/test/make-admin - 현재 사용자를 관리자로 설정 (테스트용)
 *
 * ⚠️ 이 엔드포인트는 개발/테스트 용도입니다.
 * 프로덕션에서는 Supabase Dashboard에서 직접 role을 설정하거나,
 * 별도의 관리자 승인 프로세스를 구현해야 합니다.
 */
export async function POST(_request: NextRequest) {
  try {
    // 1. 현재 로그인 사용자 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      );
    }

    // 2. Supabase Admin API로 app_metadata 업데이트
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          role: 'admin',
        },
      }
    );

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update user role',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      message: '✅ 관리자 권한이 부여되었습니다!',
      data: {
        userId: user.id,
        email: user.email,
        previousRole: user.app_metadata?.role || 'consultant',
        newRole: 'admin',
        updatedUser: {
          id: updatedUser.user.id,
          email: updatedUser.user.email,
          app_metadata: updatedUser.user.app_metadata,
        },
      },
      note: '변경사항을 적용하려면 로그아웃 후 다시 로그인하세요.',
    });
  } catch (error) {
    console.error('POST /api/admin/test/make-admin error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
