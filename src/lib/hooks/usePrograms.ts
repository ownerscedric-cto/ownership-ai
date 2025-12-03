/**
 * @file usePrograms.ts
 * @description Program React Query Hooks
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Program, ProgramFilters, ProgramsResponse } from '@/lib/types/program';
import { fetchPrograms, fetchProgramsWithMetadata, fetchProgram } from '@/lib/api/programs';

/**
 * 프로그램 목록 조회 Hook (데이터만)
 *
 * @param filters - 필터 파라미터
 * @returns React Query 결과
 *
 * @example
 * const { data, isLoading, error } = usePrograms({ page: 1, limit: 20, dataSource: '기업마당' });
 */
export function usePrograms(filters: ProgramFilters = {}): UseQueryResult<Program[], Error> {
  return useQuery({
    queryKey: ['programs', filters],
    queryFn: () => fetchPrograms(filters),
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    gcTime: 10 * 60 * 1000, // 10분 가비지 컬렉션 (구 cacheTime)
  });
}

/**
 * 프로그램 목록 조회 Hook (메타데이터 포함)
 *
 * @param filters - 필터 파라미터
 * @returns React Query 결과 (데이터 + 메타데이터)
 *
 * @example
 * const { data, isLoading } = useProgramsWithMetadata({ page: 1, keyword: '창업' });
 * // data.data: Program[]
 * // data.metadata: { total, page, limit, sourceDistribution }
 */
export function useProgramsWithMetadata(
  filters: ProgramFilters = {}
): UseQueryResult<ProgramsResponse, Error> {
  return useQuery({
    queryKey: ['programs', 'metadata', filters],
    queryFn: () => fetchProgramsWithMetadata(filters),
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    gcTime: 10 * 60 * 1000, // 10분 가비지 컬렉션
  });
}

/**
 * 프로그램 상세 조회 Hook
 *
 * @param id - 프로그램 ID
 * @returns React Query 결과
 *
 * @example
 * const { data: program, isLoading } = useProgram('program-id-123');
 */
export function useProgram(id: string | null): UseQueryResult<Program, Error> {
  return useQuery({
    queryKey: ['program', id],
    queryFn: () => {
      if (!id) throw new Error('Program ID is required');
      return fetchProgram(id);
    },
    enabled: !!id, // id가 있을 때만 실행
    staleTime: 10 * 60 * 1000, // 10분 캐싱 (상세 정보는 더 길게)
    gcTime: 30 * 60 * 1000, // 30분 가비지 컬렉션
  });
}
