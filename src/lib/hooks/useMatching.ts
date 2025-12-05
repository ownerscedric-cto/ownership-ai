/**
 * @file useMatching.ts
 * @description React Query hooks for matching system
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템
 */

'use client';

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import type { MatchingResultWithDetails } from '@/lib/types/matching';

/**
 * 매칭 결과 응답 타입
 */
export interface MatchingResultsResponse {
  total: number;
  results: MatchingResultWithDetails[];
}

/**
 * 매칭 실행 파라미터
 */
export interface RunMatchingParams {
  customerId: string;
  minScore?: number;
  maxResults?: number;
  forceRefresh?: boolean;
}

/**
 * 매칭 결과 조회 파라미터
 */
export interface FetchMatchingResultsParams {
  customerId: string;
  limit?: number;
  minScore?: number;
}

/**
 * Hook to fetch customer's matching results
 *
 * @param customerId - Customer ID
 * @param options - Query options (limit, minScore)
 * @returns React Query result
 *
 * @example
 * const { data, isLoading } = useMatchingResults('customer-id-123', { limit: 10, minScore: 30 });
 */
export function useMatchingResults(
  customerId: string | undefined,
  options?: { limit?: number; minScore?: number }
): UseQueryResult<MatchingResultWithDetails[], Error> {
  return useQuery({
    queryKey: ['matching', customerId, options],
    queryFn: async () => {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.minScore !== undefined) params.append('minScore', options.minScore.toString());

      const url = `/api/matching/${customerId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch matching results');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    gcTime: 10 * 60 * 1000, // 10분 가비지 컬렉션
  });
}

/**
 * Hook to run matching algorithm for a customer
 *
 * @returns useMutation result with runMatching function
 *
 * @example
 * const runMatching = useRunMatching();
 * runMatching.mutate({
 *   customerId: 'customer-id-123',
 *   minScore: 30,
 *   maxResults: 10,
 *   forceRefresh: false
 * });
 */
export function useRunMatching() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RunMatchingParams) => {
      const { customerId, minScore = 30, maxResults = 10, forceRefresh = false } = params;

      const response = await fetch('/api/matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          minScore,
          maxResults,
          forceRefresh,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to run matching');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate matching results query to refetch
      queryClient.invalidateQueries({
        queryKey: ['matching', variables.customerId],
      });
    },
  });
}

/**
 * Hook to check if customer has matching results
 *
 * @param customerId - Customer ID
 * @returns boolean indicating if customer has matching results
 *
 * @example
 * const hasResults = useHasMatchingResults('customer-id-123');
 */
export function useHasMatchingResults(customerId: string | undefined): boolean {
  const { data } = useMatchingResults(customerId);
  return !!data && data.length > 0;
}
