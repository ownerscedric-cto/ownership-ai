/**
 * @file analytics.ts
 * @description 대시보드 분석 데이터 Zod 검증 스키마
 * Phase 6: 대시보드 및 분석
 */

import { z } from 'zod';

/**
 * 기간 필터 스키마
 */
export const periodFilterSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  days: z.coerce.number().min(1).max(365).default(30),
});

/**
 * 트렌드 쿼리 스키마
 */
export const trendsQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  days: z.coerce.number().min(7).max(365).default(30),
});

/**
 * 대시보드 통계 응답 스키마
 */
export const dashboardStatsSchema = z.object({
  // 총계
  totalCustomers: z.number(),
  totalPrograms: z.number(),
  totalMatchings: z.number(),
  activePrograms: z.number(),

  // 최근 활동 (7일)
  recentCustomers: z.number(),
  recentMatchings: z.number(),
  recentPrograms: z.number(),

  // 인기 데이터
  topPrograms: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      matchCount: z.number(),
      dataSource: z.string().optional(),
    })
  ),
  topCustomers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      companyName: z.string().nullable(),
      matchCount: z.number(),
    })
  ),

  // 데이터소스별 프로그램 수
  programsBySource: z.array(
    z.object({
      dataSource: z.string(),
      count: z.number(),
    })
  ),

  // 최근 활동 내역
  recentActivity: z.array(
    z.object({
      type: z.enum(['customer', 'matching', 'program']),
      description: z.string(),
      createdAt: z.string(),
    })
  ),
});

/**
 * 트렌드 데이터 포인트 스키마
 */
export const trendDataPointSchema = z.object({
  date: z.string(),
  customers: z.number(),
  matchings: z.number(),
  programs: z.number(),
});

/**
 * 트렌드 데이터 응답 스키마
 */
export const trendDataSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']),
  startDate: z.string(),
  endDate: z.string(),
  data: z.array(trendDataPointSchema),
});

// 타입 추출
export type PeriodFilter = z.infer<typeof periodFilterSchema>;
export type TrendsQuery = z.infer<typeof trendsQuerySchema>;
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type TrendDataPoint = z.infer<typeof trendDataPointSchema>;
export type TrendData = z.infer<typeof trendDataSchema>;
