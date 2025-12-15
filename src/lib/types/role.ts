/**
 * @file role.ts
 * @description Role 타입 정의
 * Supabase Database Schema Types
 */

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
 * 권한 표시 이름
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  admin_panel: '관리자 패널',
  user_management: '사용자 관리',
  role_management: '역할 관리',
  education_center: '교육 센터',
  customer_management: '고객 관리',
  program_sync: '프로그램 동기화',
  matching: '매칭 시스템',
  resources: '자료실',
};

/**
 * 권한 설명
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  admin_panel: '관리자 대시보드 및 설정 접근',
  user_management: '사용자 목록 조회 및 관리',
  role_management: '역할 생성, 수정, 삭제',
  education_center: '교육 비디오, 노하우 아카이브 접근',
  customer_management: '고객 등록, 수정, 삭제',
  program_sync: '정부지원사업 데이터 동기화 실행',
  matching: '고객-프로그램 매칭 기능',
  resources: '자료실 파일 다운로드',
};

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

/**
 * 역할 생성 요청
 */
export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
  permissions: Record<Permission, boolean>;
  order?: number;
}

/**
 * 역할 수정 요청
 */
export interface UpdateRoleRequest {
  displayName?: string;
  description?: string;
  permissions?: Record<Permission, boolean>;
  order?: number;
}

/**
 * 사용자 역할 할당 요청
 */
export interface AssignRoleRequest {
  roleId: string;
}

/**
 * 기본 권한 설정 (새 역할 생성 시 기본값)
 */
export const DEFAULT_PERMISSIONS: Record<Permission, boolean> = {
  admin_panel: false,
  user_management: false,
  role_management: false,
  education_center: false,
  customer_management: true,
  program_sync: false,
  matching: true,
  resources: false,
};
