/**
 * @file program.ts
 * @description Program 및 공용 타입 정의
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
 * Customer 타입 (Supabase Database)
 */
export interface Customer {
  id: string;
  userId: string;
  businessNumber: string;
  businessType: string;
  corporateNumber: string | null;
  name: string;
  industry: string;
  companySize: string | null;
  location: string;
  budget: number | null;
  challenges: string[];
  goals: string[];
  preferredKeywords: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * EducationVideo 타입 (Supabase Database)
 */
export interface EducationVideo {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  videoUrl: string;
  videoType: string;
  thumbnailUrl: string | null;
  duration: number | null;
  viewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

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
