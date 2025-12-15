/**
 * @file programs.ts
 * @description Program API 클라이언트 함수
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

import type {
  Program,
  ProgramFilters,
  ProgramsResponse,
  ProgramResponse,
  ApiErrorResponse,
} from '@/lib/types/program';

/**
 * 프로그램 목록 조회
 *
 * @param filters - 필터 파라미터
 * @returns 프로그램 목록 및 메타데이터
 */
export async function fetchPrograms(
  filters: ProgramFilters = {}
): Promise<ProgramsResponse['data']> {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.dataSource) params.append('dataSource', filters.dataSource);
  if (filters.category) params.append('category', filters.category);
  if (filters.targetAudience) params.append('targetAudience', filters.targetAudience);
  if (filters.targetLocation) params.append('targetLocation', filters.targetLocation);
  if (filters.keyword) params.append('keyword', filters.keyword);
  // showActiveOnly는 기본값이 true이므로 false일 때만 전달
  if (filters.showActiveOnly === false) params.append('showActiveOnly', 'false');

  const url = `/api/programs?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.error.message || 'Failed to fetch programs');
  }

  const data: ProgramsResponse = await response.json();
  return data.data;
}

/**
 * 프로그램 목록 조회 (메타데이터 포함)
 *
 * @param filters - 필터 파라미터
 * @returns 프로그램 목록, 메타데이터
 */
export async function fetchProgramsWithMetadata(
  filters: ProgramFilters = {}
): Promise<ProgramsResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.dataSource) params.append('dataSource', filters.dataSource);
  if (filters.category) params.append('category', filters.category);
  if (filters.targetAudience) params.append('targetAudience', filters.targetAudience);
  if (filters.targetLocation) params.append('targetLocation', filters.targetLocation);
  if (filters.keyword) params.append('keyword', filters.keyword);
  // showActiveOnly는 기본값이 true이므로 false일 때만 전달
  if (filters.showActiveOnly === false) params.append('showActiveOnly', 'false');

  const url = `/api/programs?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.error.message || 'Failed to fetch programs');
  }

  return response.json();
}

/**
 * 프로그램 상세 조회
 *
 * @param id - 프로그램 ID
 * @returns 프로그램 상세 정보
 */
export async function fetchProgram(id: string): Promise<Program> {
  const response = await fetch(`/api/programs/${id}`);

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.error.message || 'Failed to fetch program');
  }

  const data: ProgramResponse = await response.json();
  return data.data;
}
