/**
 * @file useCopyTemplates.ts
 * @description 텍스트 복사 템플릿 관리를 위한 React Query 훅
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';

// 템플릿 사용 용도 타입
export type TemplateUsageType = 'customer' | 'internal' | 'all';

// 타입 정의
export interface CopyTemplate {
  id: string;
  name: string;
  description: string | null;
  headerTemplate: string | null;
  itemTemplate: string;
  footerTemplate: string | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  usageType: TemplateUsageType;
  createdAt: string;
  updatedAt: string;
}

export interface CopyTemplateListItem {
  id: string;
  name: string;
  description: string | null;
  headerTemplate: string | null;
  itemTemplate: string;
  footerTemplate: string | null;
  isDefault: boolean;
  usageType: TemplateUsageType;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  headerTemplate?: string;
  itemTemplate: string;
  footerTemplate?: string;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  usageType?: TemplateUsageType;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string | null;
  headerTemplate?: string | null;
  itemTemplate?: string;
  footerTemplate?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  usageType?: TemplateUsageType;
}

// API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// API 함수들
async function fetchTemplates(usageType?: TemplateUsageType): Promise<CopyTemplateListItem[]> {
  const url = usageType ? `/api/copy-templates?usageType=${usageType}` : '/api/copy-templates';
  const response = await fetch(url);
  const result: ApiResponse<CopyTemplateListItem[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || '템플릿 조회에 실패했습니다');
  }

  return result.data || [];
}

async function fetchAdminTemplates(): Promise<CopyTemplate[]> {
  const response = await fetch('/api/admin/copy-templates');
  const result: ApiResponse<CopyTemplate[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || '템플릿 조회에 실패했습니다');
  }

  return result.data || [];
}

async function fetchAdminTemplate(id: string): Promise<CopyTemplate> {
  const response = await fetch(`/api/admin/copy-templates/${id}`);
  const result: ApiResponse<CopyTemplate> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || '템플릿 조회에 실패했습니다');
  }

  return result.data!;
}

async function createTemplate(input: CreateTemplateInput): Promise<CopyTemplate> {
  const response = await fetch('/api/admin/copy-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const result: ApiResponse<CopyTemplate> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || '템플릿 생성에 실패했습니다');
  }

  return result.data!;
}

async function updateTemplate({
  id,
  data,
}: {
  id: string;
  data: UpdateTemplateInput;
}): Promise<CopyTemplate> {
  const response = await fetch(`/api/admin/copy-templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<CopyTemplate> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || '템플릿 수정에 실패했습니다');
  }

  return result.data!;
}

async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`/api/admin/copy-templates/${id}`, {
    method: 'DELETE',
  });
  const result: ApiResponse<{ message: string }> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || '템플릿 삭제에 실패했습니다');
  }
}

// ====== 사용자용 훅 ======

/**
 * 활성화된 템플릿 목록 조회 (사용자용)
 * @param usageType - 템플릿 용도 필터 (customer: 고객용, internal: 사내용, all: 전체)
 */
export function useCopyTemplates(usageType?: TemplateUsageType) {
  return useQuery({
    queryKey: usageType
      ? [...queryKeys.copyTemplates.list(), usageType]
      : queryKeys.copyTemplates.list(),
    queryFn: () => fetchTemplates(usageType),
  });
}

/**
 * 기본 템플릿 조회
 * @param usageType - 템플릿 용도 필터
 */
export function useDefaultTemplate(usageType?: TemplateUsageType) {
  const { data: templates, ...rest } = useCopyTemplates(usageType);

  const defaultTemplate = templates?.find(t => t.isDefault) || templates?.[0];

  return {
    data: defaultTemplate,
    templates,
    ...rest,
  };
}

// ====== 관리자용 훅 ======

/**
 * 모든 템플릿 목록 조회 (관리자용)
 */
export function useAdminCopyTemplates() {
  return useQuery({
    queryKey: queryKeys.admin.copyTemplates.list(),
    queryFn: fetchAdminTemplates,
  });
}

/**
 * 단일 템플릿 조회 (관리자용)
 */
export function useAdminCopyTemplate(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.copyTemplates.detail(id),
    queryFn: () => fetchAdminTemplate(id),
    enabled: !!id,
  });
}

/**
 * 템플릿 생성 뮤테이션
 */
export function useCreateCopyTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.copyTemplates.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.copyTemplates.all });
    },
  });
}

/**
 * 템플릿 수정 뮤테이션
 */
export function useUpdateCopyTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (_, variables) => {
      // 해당 템플릿 및 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.copyTemplates.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.copyTemplates.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.copyTemplates.all });
    },
  });
}

/**
 * 템플릿 삭제 뮤테이션
 */
export function useDeleteCopyTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.copyTemplates.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.copyTemplates.all });
    },
  });
}
