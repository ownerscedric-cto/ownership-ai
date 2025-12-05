/**
 * @file matching.ts
 * @description 매칭 시스템 TypeScript 타입 정의
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템
 */

import { z } from 'zod';

/**
 * 매칭 결과 타입
 */
export interface MatchingResult {
  id: string;
  customerId: string;
  programId: string;
  score: number; // 0-100점
  matchedIndustry: boolean;
  matchedLocation: boolean;
  matchedKeywords: string[];
  createdAt: Date;
}

/**
 * 매칭 요청 스키마 (Zod)
 */
export const matchingRequestSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID format'),
});

export type MatchingRequest = z.infer<typeof matchingRequestSchema>;

/**
 * 매칭 응답 타입
 */
export interface MatchingResponse {
  total: number; // 총 매칭된 프로그램 수
  results: MatchingResultWithDetails[];
}

/**
 * 프로그램 상세 정보를 포함한 매칭 결과
 */
export interface MatchingResultWithDetails extends MatchingResult {
  program: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    targetAudience: string[];
    targetLocation: string[];
    keywords: string[];
    budgetRange: string | null;
    deadline: Date | null;
    sourceUrl: string | null;
    dataSource: string;
    rawData: unknown | null;
  };
}

/**
 * 매칭 점수 구성
 */
export interface MatchingScoreBreakdown {
  industryScore: number; // 0 or 30
  locationScore: number; // 0 or 30
  keywordScore: number; // 0-40 (기본 10 + 선호 15)
  totalScore: number; // 0-100
}

/**
 * 매칭 알고리즘 설정
 */
export const MATCHING_CONFIG = {
  // 점수 가중치
  WEIGHTS: {
    INDUSTRY: 30,
    LOCATION: 30,
    KEYWORD_BASE: 10,
    KEYWORD_PREFERRED: 15,
    KEYWORD_MAX: 40,
  },
  // 매칭 기준
  MIN_SCORE: 30, // 최소 30점 이상 (업종 또는 지역 최소 하나 일치 필수)
  MAX_RESULTS: 50, // 상위 50개 프로그램 선택
} as const;

/**
 * 매칭 실행 옵션
 */
export interface MatchingOptions {
  customerId: string;
  minScore?: number; // 최소 점수 (기본: 30점)
  maxResults?: number; // 최대 결과 수 (기본: 10개)
  forceRefresh?: boolean; // 기존 매칭 결과 무시하고 재실행 (기본: false)
}
