/**
 * @file useTemplateVariables.ts
 * @description 템플릿 변수 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 타입 정의
export interface TemplateVariable {
  id: string;
  name: string;
  displayName: string;
  value: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// 쿼리 키
const QUERY_KEYS = {
  variables: ['template-variables'] as const,
  adminVariables: ['admin', 'template-variables'] as const,
};

// ==================== 사용자용 훅 ====================

/**
 * 활성화된 템플릿 변수 목록 조회 (사용자용)
 */
export function useTemplateVariables() {
  return useQuery({
    queryKey: QUERY_KEYS.variables,
    queryFn: async (): Promise<ApiResponse<TemplateVariable[]>> => {
      const response = await fetch('/api/template-variables');
      if (!response.ok) {
        throw new Error('Failed to fetch template variables');
      }
      return response.json();
    },
  });
}

// ==================== 관리자용 훅 ====================

/**
 * 모든 템플릿 변수 목록 조회 (관리자용)
 */
export function useAdminTemplateVariables() {
  return useQuery({
    queryKey: QUERY_KEYS.adminVariables,
    queryFn: async (): Promise<ApiResponse<TemplateVariable[]>> => {
      const response = await fetch('/api/admin/template-variables');
      if (!response.ok) {
        throw new Error('Failed to fetch template variables');
      }
      return response.json();
    },
  });
}

/**
 * 템플릿 변수 생성
 */
export function useCreateVariable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      displayName: string;
      value: string;
      description?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    }): Promise<ApiResponse<TemplateVariable>> => {
      const response = await fetch('/api/admin/template-variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: result => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminVariables });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variables });
      }
    },
  });
}

/**
 * 템플릿 변수 수정
 */
export function useUpdateVariable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        displayName?: string;
        value?: string;
        description?: string | null;
        sortOrder?: number;
        isActive?: boolean;
      };
    }): Promise<ApiResponse<TemplateVariable>> => {
      const response = await fetch(`/api/admin/template-variables/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: result => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminVariables });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variables });
      }
    },
  });
}

/**
 * 템플릿 변수 삭제
 */
export function useDeleteVariable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`/api/admin/template-variables/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminVariables });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variables });
    },
  });
}
