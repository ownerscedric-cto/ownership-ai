import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/users - 전체 사용자 목록 조회 (관리자 전용)
 *
 * ⚠️ requireAdmin 미들웨어로 보호됨
 * - role이 'admin'이 아니면 403 Forbidden 반환
 */
export async function GET(request: NextRequest) {
  // 1. Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response; // 401 or 403
  }

  try {
    // 2. 전체 사용자 목록 조회
    const {
      data: { users },
      error,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_USERS_FAILED',
            message: 'Failed to fetch users',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    // 3. 사용자 통계 계산
    const stats = {
      total: users.length,
      admins: users.filter(u => u.app_metadata?.role === 'admin').length,
      consultants: users.filter(u => !u.app_metadata?.role || u.app_metadata?.role === 'consultant')
        .length,
    };

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          role: u.app_metadata?.role || 'consultant',
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          email_confirmed_at: u.email_confirmed_at,
        })),
        stats,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch users',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
