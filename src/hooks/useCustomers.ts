'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { Customer } from "@/lib/types/program";
import type { CreateCustomerInput } from '@/lib/validations/customer';

// API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    total: number;
    page: number;
    limit: number;
  };
}

// 고객 목록 조회 파라미터
interface CustomersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  name?: string;
  industry?: string;
  location?: string;
}

/**
 * 고객 목록 조회 Hook
 */
export function useCustomers(params: CustomersParams = {}) {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = params;

  return useQuery({
    queryKey: ['customers', page, limit, sortBy, sortOrder, filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
        ),
      });

      const response = await fetch(`/api/customers?${searchParams}`);
      const result: ApiResponse<Customer[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || '고객 목록을 불러오는데 실패했습니다');
      }

      return {
        customers: result.data,
        metadata: result.metadata || { total: 0, page: 1, limit: 10 },
      };
    },
    staleTime: 1 * 60 * 1000, // 1분
  });
}

/**
 * 단일 고객 조회 Hook
 */
export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${id}`);
      const result: ApiResponse<Customer> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || '고객 정보를 불러오는데 실패했습니다');
      }

      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 고객 생성 Hook
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: CreateCustomerInput) => {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<Customer> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || '고객 생성에 실패했습니다');
      }

      return result.data;
    },
    onSuccess: newCustomer => {
      // 고객 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      // 새로 생성된 고객 캐시에 추가
      queryClient.setQueryData(['customer', newCustomer.id], newCustomer);

      // 고객 상세 페이지로 이동
      router.push(`/customers/${newCustomer.id}`);
    },
  });
}

/**
 * 고객 수정 Hook
 */
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CreateCustomerInput>) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<Customer> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || '고객 수정에 실패했습니다');
      }

      return result.data;
    },
    onSuccess: updatedCustomer => {
      // 해당 고객 캐시 업데이트
      queryClient.setQueryData(['customer', id], updatedCustomer);

      // 고객 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

/**
 * 고객 삭제 Hook
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<Customer> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || '고객 삭제에 실패했습니다');
      }

      return result;
    },
    onSuccess: (_, deletedId) => {
      // 삭제된 고객 캐시 제거
      queryClient.removeQueries({ queryKey: ['customer', deletedId] });

      // 고객 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      // 고객 목록 페이지로 이동
      router.push('/customers');
    },
  });
}
