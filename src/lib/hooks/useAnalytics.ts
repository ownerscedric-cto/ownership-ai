/**
 * @file useAnalytics.ts
 * @description Analytics React Query Hooks
 * Phase 6: 대시보드 및 분석
 */

'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { DashboardStats, TrendData, TrendsQuery } from '@/lib/validations/analytics';

/**
 * 대시보드 통계 데이터 조회
 */
async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/analytics');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || '대시보드 통계 조회에 실패했습니다');
  }

  const result = await response.json();
  return result.data;
}

/**
 * 트렌드 데이터 조회
 */
async function fetchTrendData(params: TrendsQuery): Promise<TrendData> {
  const searchParams = new URLSearchParams({
    period: params.period || 'weekly',
    days: String(params.days || 30),
  });

  const response = await fetch(`/api/analytics/trends?${searchParams}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || '트렌드 데이터 조회에 실패했습니다');
  }

  const result = await response.json();
  return result.data;
}

/**
 * 대시보드 통계 조회 Hook
 *
 * @returns React Query 결과
 *
 * @example
 * const { data: stats, isLoading, error } = useDashboardStats();
 * // stats.totalCustomers, stats.totalPrograms, stats.topPrograms 등
 */
export function useDashboardStats(): UseQueryResult<DashboardStats, Error> {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    gcTime: 10 * 60 * 1000, // 10분 가비지 컬렉션
    refetchOnWindowFocus: false, // 대시보드는 자주 갱신할 필요 없음
  });
}

/**
 * 트렌드 데이터 조회 Hook
 *
 * @param params - 기간 및 일수 설정
 * @returns React Query 결과
 *
 * @example
 * const { data: trends } = useTrendData({ period: 'weekly', days: 30 });
 * // trends.data: [{ date: '2024-01-01', customers: 5, matchings: 10, programs: 20 }, ...]
 */
export function useTrendData(
  params: TrendsQuery = { period: 'weekly', days: 30 }
): UseQueryResult<TrendData, Error> {
  return useQuery({
    queryKey: ['analytics', 'trends', params],
    queryFn: () => fetchTrendData(params),
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    gcTime: 10 * 60 * 1000, // 10분 가비지 컬렉션
    refetchOnWindowFocus: false,
  });
}

/**
 * 대시보드 통계 및 트렌드 동시 조회 Hook
 *
 * @param trendParams - 트렌드 파라미터
 * @returns 대시보드 통계와 트렌드 데이터
 *
 * @example
 * const { stats, trends, isLoading } = useDashboardData({ period: 'weekly', days: 30 });
 */
export function useDashboardData(trendParams: TrendsQuery = { period: 'weekly', days: 30 }) {
  const statsQuery = useDashboardStats();
  const trendsQuery = useTrendData(trendParams);

  return {
    stats: statsQuery.data,
    trends: trendsQuery.data,
    isLoading: statsQuery.isLoading || trendsQuery.isLoading,
    isError: statsQuery.isError || trendsQuery.isError,
    error: statsQuery.error || trendsQuery.error,
    refetch: () => {
      statsQuery.refetch();
      trendsQuery.refetch();
    },
  };
}
