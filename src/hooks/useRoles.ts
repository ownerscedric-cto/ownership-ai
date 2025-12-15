/**
 * @file useRoles.ts
 * @description 역할 관리 React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Role,
  UserRoleInfo,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleRequest,
} from '@/lib/types/role';

// =====================================================
// Query Keys
// =====================================================

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: () => [...roleKeys.lists()] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
  userRole: (userId: string) => [...roleKeys.all, 'user', userId] as const,
  myRole: () => [...roleKeys.all, 'me'] as const,
};

// =====================================================
// API 함수
// =====================================================

async function fetchRoles(): Promise<Role[]> {
  const response = await fetch('/api/admin/roles');
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to fetch roles');
  }

  return data.data;
}

async function fetchRole(roleId: string): Promise<Role> {
  const response = await fetch(`/api/admin/roles/${roleId}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to fetch role');
  }

  return data.data;
}

async function createRole(request: CreateRoleRequest): Promise<Role> {
  const response = await fetch('/api/admin/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to create role');
  }

  return data.data;
}

async function updateRole(roleId: string, request: UpdateRoleRequest): Promise<Role> {
  const response = await fetch(`/api/admin/roles/${roleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to update role');
  }

  return data.data;
}

async function deleteRole(roleId: string): Promise<void> {
  const response = await fetch(`/api/admin/roles/${roleId}`, {
    method: 'DELETE',
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to delete role');
  }
}

async function fetchMyRole(): Promise<UserRoleInfo> {
  const response = await fetch('/api/auth/me/role');
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to fetch my role');
  }

  return data.data;
}

async function assignUserRole(userId: string, request: AssignRoleRequest): Promise<void> {
  const response = await fetch(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to assign role');
  }
}

// =====================================================
// React Query Hooks
// =====================================================

/**
 * 모든 역할 목록 조회
 */
export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 특정 역할 상세 조회
 */
export function useRole(roleId: string) {
  return useQuery({
    queryKey: roleKeys.detail(roleId),
    queryFn: () => fetchRole(roleId),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 현재 로그인한 사용자의 역할 정보 조회
 */
export function useMyRole() {
  return useQuery({
    queryKey: roleKeys.myRole(),
    queryFn: fetchMyRole,
    staleTime: 10 * 60 * 1000, // 10분
    retry: false, // 로그인 안 되어 있으면 재시도 안 함
  });
}

/**
 * 역할 생성
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

/**
 * 역할 수정
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, request }: { roleId: string; request: UpdateRoleRequest }) =>
      updateRole(roleId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.roleId) });
    },
  });
}

/**
 * 역할 삭제
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

/**
 * 사용자 역할 할당
 */
export function useAssignUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, request }: { userId: string; request: AssignRoleRequest }) =>
      assignUserRole(userId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.userRole(variables.userId) });
      // 사용자 목록도 갱신
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// =====================================================
// 권한 체크 유틸리티 hooks
// =====================================================

/**
 * 현재 사용자가 특정 권한을 가지고 있는지 체크
 */
export function useHasPermission(permission: string) {
  const { data: myRole, isLoading } = useMyRole();

  if (isLoading || !myRole) {
    return { hasPermission: false, isLoading };
  }

  const hasPerm =
    myRole.role.permissions[permission as keyof typeof myRole.role.permissions] === true;

  return { hasPermission: hasPerm, isLoading: false };
}

/**
 * 현재 사용자가 관리자인지 체크
 */
export function useIsAdmin() {
  const { data: myRole, isLoading } = useMyRole();

  if (isLoading || !myRole) {
    return { isAdmin: false, isLoading };
  }

  return { isAdmin: myRole.role.name === 'admin', isLoading: false };
}

/**
 * 현재 사용자가 교육 센터 접근 권한이 있는지 체크
 */
export function useCanAccessEducation() {
  return useHasPermission('education_center');
}
