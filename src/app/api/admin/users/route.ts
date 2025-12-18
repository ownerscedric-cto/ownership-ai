import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/users - 전체 사용자 목록 조회 (관리자 전용)
 *
 * ⚠️ requireAdmin 미들웨어로 보호됨 (DB user_roles 테이블 기반)
 * - role이 'admin'이 아니면 403 Forbidden 반환
 */
export async function GET(request: NextRequest) {
  // 1. Admin 권한 체크 (DB 기반)
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

    // 3. DB 기반 역할 정보 조회 (user_roles 테이블)
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('userId, role:roleId(id, name, displayName)');

    // userId -> role 맵 생성
    const userRoleMap = new Map<string, { id: string; name: string; displayName: string }>();
    if (userRoles) {
      for (const ur of userRoles) {
        const role = Array.isArray(ur.role) ? ur.role[0] : ur.role;
        if (role) {
          userRoleMap.set(ur.userId, {
            id: role.id,
            name: role.name,
            displayName: role.displayName,
          });
        }
      }
    }

    // 기본 역할 조회
    const { data: defaultRole } = await supabaseAdmin
      .from('roles')
      .select('id, name, displayName')
      .eq('name', 'consultant')
      .single();

    const fallbackRole = defaultRole || { id: '', name: 'consultant', displayName: '컨설턴트' };

    // 4. 사용자 통계 계산 (DB 기반)
    const usersWithRoles = users.map(u => ({
      id: u.id,
      email: u.email,
      role: userRoleMap.get(u.id) || fallbackRole,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
    }));

    // 역할별 통계 계산
    const { data: roles } = await supabaseAdmin
      .from('roles')
      .select('name, displayName')
      .order('order');

    const roleStats: Record<string, number> = {};
    if (roles) {
      for (const role of roles) {
        roleStats[role.name] = usersWithRoles.filter(u => u.role.name === role.name).length;
      }
    }

    const stats = {
      total: users.length,
      byRole: roleStats,
    };

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        users: usersWithRoles,
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
