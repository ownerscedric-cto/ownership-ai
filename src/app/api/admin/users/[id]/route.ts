import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * DELETE /api/admin/users/[id] - 사용자 계정 삭제 (관리자 전용)
 *
 * ⚠️ requireAdmin 미들웨어로 보호됨 (DB user_roles 테이블 기반)
 * - role이 'admin'이 아니면 403 Forbidden 반환
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Admin 권한 체크 (DB 기반)
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response; // 401 or 403
  }

  const { id: userId } = await params;

  // 2. 자기 자신은 삭제 불가
  if (authResult.user?.id === userId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: '자기 자신은 삭제할 수 없습니다.',
        },
      },
      { status: 400 }
    );
  }

  try {
    // 3. user_roles 테이블에서 해당 사용자의 역할 삭제
    await supabaseAdmin.from('user_roles').delete().eq('userId', userId);

    // 4. Supabase Auth에서 사용자 삭제
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DELETE_USER_FAILED',
            message: '사용자 삭제에 실패했습니다.',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        message: '사용자가 삭제되었습니다.',
        userId,
      },
    });
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '사용자 삭제 중 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
