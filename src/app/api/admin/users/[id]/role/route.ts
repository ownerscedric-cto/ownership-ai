/**
 * @file /api/admin/users/[id]/role/route.ts
 * @description 사용자 역할 할당 API (DB 기반)
 *
 * 변경사항:
 * - 기존: Supabase Auth app_metadata 기반
 * - 현재: user_roles DB 테이블 기반
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdminRole, assignUserRole, getUserRole } from '@/lib/auth/roles';
import { successResponse, errorResponse } from '@/lib/api/response';

// =====================================================
// Zod 스키마
// =====================================================

const updateRoleSchema = z.object({
  roleId: z.string().uuid({ message: '올바른 역할 ID가 아닙니다' }),
});

// =====================================================
// GET: 특정 사용자의 역할 조회
// =====================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;

    // 관리자 권한 체크
    const authResult = await requireAdminRole(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // 사용자 존재 여부 확인
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user.user) {
      return errorResponse('USER_NOT_FOUND', '사용자를 찾을 수 없습니다', undefined, 404);
    }

    // 사용자 역할 조회
    const userRole = await getUserRole(userId);

    return successResponse({
      userId,
      email: user.user.email,
      role: userRole.role,
      assignedAt: userRole.assignedAt,
    });
  } catch (error) {
    console.error('GET /api/admin/users/[id]/role error:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      '역할 정보를 불러오는데 실패했습니다',
      error instanceof Error ? error.message : undefined,
      500
    );
  }
}

// =====================================================
// PATCH: 사용자 역할 변경
// =====================================================

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;

    // 관리자 권한 체크
    const authResult = await requireAdminRole(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // 사용자 존재 여부 확인
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user.user) {
      return errorResponse('USER_NOT_FOUND', '사용자를 찾을 수 없습니다', undefined, 404);
    }

    // 요청 데이터 검증
    const body = await request.json();
    const parseResult = updateRoleSchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        '입력값이 올바르지 않습니다',
        { errors: parseResult.error.flatten().fieldErrors },
        400
      );
    }

    const { roleId } = parseResult.data;

    // 역할 존재 여부 확인
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name, displayName')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return errorResponse('ROLE_NOT_FOUND', '역할을 찾을 수 없습니다', undefined, 404);
    }

    // 역할 할당 (현재 관리자 ID 기록)
    await assignUserRole(userId, roleId, authResult.user.id);

    // 성공 응답
    return successResponse({
      userId,
      email: user.user.email,
      role: {
        id: role.id,
        name: role.name,
        displayName: role.displayName,
      },
      message: `역할이 ${role.displayName}(으)로 변경되었습니다.`,
    });
  } catch (error) {
    console.error('PATCH /api/admin/users/[id]/role error:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      '역할 변경에 실패했습니다',
      error instanceof Error ? error.message : undefined,
      500
    );
  }
}

// =====================================================
// DELETE: 사용자 역할 제거 (기본 역할로 복귀)
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // 관리자 권한 체크
    const authResult = await requireAdminRole(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // 사용자 존재 여부 확인
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user.user) {
      return errorResponse('USER_NOT_FOUND', '사용자를 찾을 수 없습니다', undefined, 404);
    }

    // user_roles 테이블에서 삭제 (기본 역할인 consultant로 복귀)
    const { error } = await supabaseAdmin.from('user_roles').delete().eq('userId', userId);

    if (error) {
      console.error('Failed to remove user role:', error);
      return errorResponse('DELETE_FAILED', '역할 제거에 실패했습니다', undefined, 500);
    }

    return successResponse({
      userId,
      email: user.user.email,
      message: '역할이 기본 역할(컨설턴트)로 복귀되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/users/[id]/role error:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      '역할 제거에 실패했습니다',
      error instanceof Error ? error.message : undefined,
      500
    );
  }
}
