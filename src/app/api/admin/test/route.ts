import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/test - Supabase Auth 테스트 엔드포인트
 *
 * 테스트 항목:
 * 1. 현재 로그인된 사용자 정보 조회
 * 2. app_metadata에서 role 확인
 * 3. Supabase Admin API로 전체 유저 목록 조회 (관리자 권한 테스트)
 */
export async function GET(_request: NextRequest) {
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
          authError: authError?.message,
        },
        { status: 401 }
      );
    }

    // 2. app_metadata에서 role 확인
    const role = user.app_metadata?.role || 'consultant';

    // 3. Supabase Admin API 테스트 (전체 유저 목록 조회)
    const {
      data: { users },
      error: adminError,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (adminError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch users with admin API',
          adminError: adminError.message,
        },
        { status: 500 }
      );
    }

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        currentUser: {
          id: user.id,
          email: user.email,
          role: role,
          isAdmin: role === 'admin',
          app_metadata: user.app_metadata,
          user_metadata: user.user_metadata,
        },
        allUsers: users.map(u => ({
          id: u.id,
          email: u.email,
          role: u.app_metadata?.role || 'consultant',
          created_at: u.created_at,
        })),
        summary: {
          totalUsers: users.length,
          adminCount: users.filter(u => u.app_metadata?.role === 'admin').length,
          consultantCount: users.filter(
            u => !u.app_metadata?.role || u.app_metadata?.role === 'consultant'
          ).length,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/admin/test error:', error);

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
