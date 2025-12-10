/**
 * @file program.ts
 * @description Program 타입 정의
 * Supabase Database Schema Types
 */

/**
 * Program 타입 (Supabase Database)
 */
export type Program = {
  id: string;
  dataSource: string;
  sourceApiId: string;
  title: string;
  description: string | null;
  category: string | null;
  targetAudience: string[];
  targetLocation: string[];
  keywords: string[];
  budgetRange: string | null;
  deadline: Date | null;
  sourceUrl: string | null;
  attachmentUrl: string | null;
  rawData: Record<string, unknown> | null;
  registeredAt: Date;
  startDate: Date | null;
  endDate: Date | null;
  lastSyncedAt: Date;
  syncStatus: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Program 필터 파라미터
 */
export interface ProgramFilters {
  page?: number;
  limit?: number;
  dataSource?: string;
  category?: string;
  targetAudience?: string;
  targetLocation?: string;
  keyword?: string;
}

/**
 * GET /api/programs 응답 타입
 */
export interface ProgramsResponse {
  success: true;
  data: Program[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    sourceDistribution: Record<string, number>;
  };
}

/**
 * GET /api/programs/[id] 응답 타입
 */
export interface ProgramResponse {
  success: true;
  data: Program;
}

/**
 * API 에러 응답 타입
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
