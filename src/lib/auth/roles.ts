/**
 * @file roles.ts
 * @description 역할 기반 권한 관리 시스템 (DB 기반)
 *
 * 이 파일은 user_roles 테이블을 기반으로 사용자 권한을 체크합니다.
 * 기존 app_metadata 방식에서 DB 기반 방식으로 전환합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { User } from '@supabase/supabase-js';

// =====================================================
// 타입 정의
// =====================================================

/**
 * 권한 목록 (permissions JSON 필드의 키)
 */
export type Permission =
  | 'admin_panel'
  | 'user_management'
  | 'role_management'
  | 'education_center'
  | 'customer_management'
  | 'program_sync'
  | 'matching'
  | 'resources';

/**
 * DB roles 테이블 레코드 타입
 */
export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  permissions: Record<Permission, boolean>;
  isSystem: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * DB user_roles 테이블 레코드 타입
 */
export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string | null;
  role?: Role;
}

/**
 * 사용자 역할 정보 (조회 결과)
 */
export interface UserRoleInfo {
  userId: string;
  role: Role;
  assignedAt: string;
}

// =====================================================
// 역할 조회 함수
// =====================================================

/**
 * 모든 역할 목록 조회
 */
export async function getAllRoles(): Promise<Role[]> {
  const { data, error } = await supabaseAdmin
    .from('roles')
    .select('*')
    .order('order', { ascending: true });

  if (error) {
    console.error('getAllRoles error:', error);
    throw new Error('Failed to fetch roles');
  }

  return data || [];
}

/**
 * 역할 ID로 역할 조회
 */
export async function getRoleById(roleId: string): Promise<Role | null> {
  const { data, error } = await supabaseAdmin.from('roles').select('*').eq('id', roleId).single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('getRoleById error:', error);
    throw new Error('Failed to fetch role');
  }

  return data;
}

/**
 * 역할 이름으로 역할 조회
 */
export async function getRoleByName(name: string): Promise<Role | null> {
  const { data, error } = await supabaseAdmin.from('roles').select('*').eq('name', name).single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('getRoleByName error:', error);
    throw new Error('Failed to fetch role');
  }

  return data;
}

// =====================================================
// 사용자 역할 조회/할당 함수
// =====================================================

/**
 * 사용자의 역할 정보 조회
 * user_roles 테이블에 없으면 기본 역할(consultant) 반환
 */
export async function getUserRole(userId: string): Promise<UserRoleInfo> {
  // user_roles에서 역할 조회 (roles 테이블 JOIN)
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select(
      `
      id,
      userId:userId,
      roleId:roleId,
      assignedAt:assignedAt,
      role:roleId (
        id,
        name,
        displayName,
        description,
        permissions,
        isSystem,
        order,
        createdAt,
        updatedAt
      )
    `
    )
    .eq('userId', userId)
    .single();

  // 역할이 없으면 기본 역할(consultant) 반환
  if (error || !data) {
    const defaultRole = await getRoleByName('consultant');
    if (!defaultRole) {
      throw new Error('Default role (consultant) not found');
    }
    return {
      userId,
      role: defaultRole,
      assignedAt: new Date().toISOString(),
    };
  }

  // role이 배열로 반환될 수 있으므로 처리
  const role = Array.isArray(data.role) ? data.role[0] : data.role;

  return {
    userId,
    role: role as Role,
    assignedAt: data.assignedAt,
  };
}

/**
 * 사용자에게 역할 할당
 * 이미 역할이 있으면 업데이트, 없으면 생성
 */
export async function assignUserRole(
  userId: string,
  roleId: string,
  assignedBy?: string
): Promise<UserRole> {
  // 역할 존재 여부 확인
  const role = await getRoleById(roleId);
  if (!role) {
    throw new Error('Role not found');
  }

  // upsert (있으면 업데이트, 없으면 생성)
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .upsert(
      {
        userId,
        roleId,
        assignedBy,
        assignedAt: new Date().toISOString(),
      },
      {
        onConflict: 'userId',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('assignUserRole error:', error);
    throw new Error('Failed to assign role');
  }

  return data;
}

/**
 * 사용자 역할 삭제 (기본 역할로 복귀)
 */
export async function removeUserRole(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('user_roles').delete().eq('userId', userId);

  if (error) {
    console.error('removeUserRole error:', error);
    throw new Error('Failed to remove role');
  }
}

// =====================================================
// 권한 체크 함수
// =====================================================

/**
 * 사용자가 특정 권한을 가지고 있는지 체크
 */
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  try {
    const userRole = await getUserRole(userId);
    return userRole.role.permissions[permission] === true;
  } catch (error) {
    console.error('hasPermission error:', error);
    return false;
  }
}

/**
 * 사용자가 여러 권한 중 하나라도 가지고 있는지 체크
 */
export async function hasAnyPermission(
  userId: string,
  permissions: Permission[]
): Promise<boolean> {
  try {
    const userRole = await getUserRole(userId);
    return permissions.some(perm => userRole.role.permissions[perm] === true);
  } catch (error) {
    console.error('hasAnyPermission error:', error);
    return false;
  }
}

/**
 * 사용자가 모든 권한을 가지고 있는지 체크
 */
export async function hasAllPermissions(
  userId: string,
  permissions: Permission[]
): Promise<boolean> {
  try {
    const userRole = await getUserRole(userId);
    return permissions.every(perm => userRole.role.permissions[perm] === true);
  } catch (error) {
    console.error('hasAllPermissions error:', error);
    return false;
  }
}

/**
 * 사용자가 특정 역할을 가지고 있는지 체크
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const userRole = await getUserRole(userId);
    return userRole.role.name === roleName;
  } catch (error) {
    console.error('hasRole error:', error);
    return false;
  }
}

/**
 * 사용자가 관리자인지 체크
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  return hasRole(userId, 'admin');
}

// =====================================================
// API 미들웨어
// =====================================================

interface RequireAuthSuccess {
  success: true;
  user: User;
  userRole: UserRoleInfo;
}

interface RequireAuthError {
  success: false;
  response: NextResponse;
}

type RequireAuthResult = RequireAuthSuccess | RequireAuthError;

/**
 * 인증 + 권한 체크 미들웨어
 *
 * @param _request - Next.js request object (현재 미사용, 확장성을 위해 유지)
 * @param requiredPermission - 필요한 권한 (선택)
 * @returns 성공 시 user와 userRole, 실패 시 에러 응답
 *
 * @example
 * ```typescript
 * // 인증만 체크
 * const result = await requireAuth(request);
 *
 * // 특정 권한 체크
 * const result = await requireAuth(request, 'education_center');
 * ```
 */
export async function requireAuth(
  _request: NextRequest,
  requiredPermission?: Permission
): Promise<RequireAuthResult> {
  try {
    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: '로그인이 필요합니다',
            },
          },
          { status: 401 }
        ),
      };
    }

    // 2. 역할 조회
    const userRole = await getUserRole(user.id);

    // 3. 권한 체크 (requiredPermission이 지정된 경우)
    if (requiredPermission) {
      const hasPerm = userRole.role.permissions[requiredPermission] === true;

      if (!hasPerm) {
        return {
          success: false,
          response: NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: '접근 권한이 없습니다',
                details: {
                  required: requiredPermission,
                  currentRole: userRole.role.name,
                },
              },
            },
            { status: 403 }
          ),
        };
      }
    }

    // 4. 성공
    return {
      success: true,
      user,
      userRole,
    };
  } catch (error) {
    console.error('requireAuth error:', error);

    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '인증 확인 중 오류가 발생했습니다',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        { status: 500 }
      ),
    };
  }
}

/**
 * 관리자 권한 체크 미들웨어 (DB 기반)
 * requireAdmin의 DB 기반 버전
 */
export async function requireAdminRole(_request: NextRequest): Promise<RequireAuthResult> {
  return requireAuth(_request, 'admin_panel');
}

/**
 * 교육 센터 접근 권한 체크 미들웨어
 */
export async function requireEducationAccess(_request: NextRequest): Promise<RequireAuthResult> {
  return requireAuth(_request, 'education_center');
}
