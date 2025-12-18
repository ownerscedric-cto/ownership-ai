import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserRole } from '@/lib/auth/roles';

/**
 * POST /api/admin/test/make-admin - 현재 사용자를 관리자로 설정 (테스트용)
 *
 * ⚠️ 이 엔드포인트는 개발/테스트 용도입니다.
 * 프로덕션에서는 Supabase Dashboard에서 직접 role을 설정하거나,
 * 별도의 관리자 승인 프로세스를 구현해야 합니다.
 *
 * 역할 관리: DB user_roles 테이블 기반
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

    // 2. 현재 역할 조회 (DB 기반)
    const currentRoleInfo = await getUserRole(user.id);
    const previousRole = currentRoleInfo.role.name;

    // 3. admin 역할 ID 조회
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name, displayName')
      .eq('name', 'admin')
      .single();

    if (roleError || !adminRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin role not found in database',
        },
        { status: 500 }
      );
    }

    // 4. user_roles 테이블에 admin 역할 할당 (upsert)
    const { error: upsertError } = await supabaseAdmin.from('user_roles').upsert(
      {
        userId: user.id,
        roleId: adminRole.id,
        assignedBy: user.id, // 자신이 할당
        assignedAt: new Date().toISOString(),
      },
      {
        onConflict: 'userId',
      }
    );

    if (upsertError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update user role in database',
          details: upsertError.message,
        },
        { status: 500 }
      );
    }

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      message: '✅ 관리자 권한이 부여되었습니다!',
      data: {
        userId: user.id,
        email: user.email,
        previousRole,
        newRole: 'admin',
        roleInfo: {
          id: adminRole.id,
          name: adminRole.name,
          displayName: adminRole.displayName,
        },
      },
      note: '변경사항이 즉시 적용됩니다. (DB 기반 역할 관리)',
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
