/**
 * @file useCopySnippets.ts
 * @description 스니펫 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 스니펫 타입
export interface CopySnippet {
  id: string;
  name: string;
  content: string;
  category: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API 응답 타입
interface SnippetsResponse {
  success: boolean;
  data?: CopySnippet[];
  error?: { code: string; message: string };
}

interface SnippetResponse {
  success: boolean;
  data?: CopySnippet;
  error?: { code: string; message: string };
}

// 쿼리 키
export const snippetKeys = {
  all: ['snippets'] as const,
  list: (category?: string) => [...snippetKeys.all, 'list', category] as const,
  admin: ['admin-snippets'] as const,
  detail: (id: string) => [...snippetKeys.admin, id] as const,
};

// 사용자용: 활성화된 스니펫 조회
export function useCopySnippets(category?: string) {
  return useQuery<SnippetsResponse, Error>({
    queryKey: snippetKeys.list(category),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);

      const res = await fetch(`/api/copy-snippets?${params.toString()}`);
      return res.json();
    },
  });
}

// 관리자용: 모든 스니펫 조회
export function useAdminCopySnippets() {
  return useQuery<SnippetsResponse, Error>({
    queryKey: snippetKeys.admin,
    queryFn: async () => {
      const res = await fetch('/api/admin/copy-snippets');
      return res.json();
    },
  });
}

// 스니펫 생성
export function useCreateSnippet() {
  const queryClient = useQueryClient();

  return useMutation<SnippetResponse, Error, Partial<CopySnippet>>({
    mutationFn: async data => {
      const res = await fetch('/api/admin/copy-snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: snippetKeys.all });
      queryClient.invalidateQueries({ queryKey: snippetKeys.admin });
    },
  });
}

// 스니펫 수정
export function useUpdateSnippet() {
  const queryClient = useQueryClient();

  return useMutation<SnippetResponse, Error, { id: string; data: Partial<CopySnippet> }>({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/admin/copy-snippets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: snippetKeys.all });
      queryClient.invalidateQueries({ queryKey: snippetKeys.admin });
    },
  });
}

// 스니펫 삭제
export function useDeleteSnippet() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async id => {
      const res = await fetch(`/api/admin/copy-snippets/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: snippetKeys.all });
      queryClient.invalidateQueries({ queryKey: snippetKeys.admin });
    },
  });
}
