/**
 * @file report.ts
 * @description 리포트 생성 관련 Zod 스키마
 * Phase 6: 대시보드 및 분석
 */

import { z } from 'zod';

// 리포트 생성 요청 스키마
export const generateReportSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
  includeCustomers: z.boolean().default(true),
  includePrograms: z.boolean().default(true),
  includeMatchings: z.boolean().default(true),
});

// 리포트 데이터 스키마
export const reportDataSchema = z.object({
  // 기간 정보
  period: z.object({
    startDate: z.string(),
    endDate: z.string(),
    generatedAt: z.string(),
  }),

  // 요약 통계
  summary: z.object({
    totalCustomers: z.number(),
    newCustomers: z.number(),
    totalPrograms: z.number(),
    activePrograms: z.number(),
    totalMatchings: z.number(),
    newMatchings: z.number(),
  }),

  // 고객 통계
  customerStats: z
    .object({
      byIndustry: z.array(
        z.object({
          industry: z.string(),
          count: z.number(),
        })
      ),
      topCustomers: z.array(
        z.object({
          name: z.string(),
          matchCount: z.number(),
        })
      ),
      // 고객별 매칭 키워드 통계
      customerKeywords: z
        .array(
          z.object({
            customerId: z.string(),
            customerName: z.string(),
            industry: z.string().optional(),
            matchedKeywords: z.array(z.string()),
            matchCount: z.number(),
            avgScore: z.number(),
          })
        )
        .optional(),
    })
    .optional(),

  // 프로그램 통계
  programStats: z
    .object({
      byDataSource: z.array(
        z.object({
          dataSource: z.string(),
          count: z.number(),
        })
      ),
      topPrograms: z.array(
        z.object({
          title: z.string(),
          matchCount: z.number(),
        })
      ),
    })
    .optional(),

  // 매칭 통계
  matchingStats: z
    .object({
      averageScore: z.number(),
      scoreDistribution: z.array(
        z.object({
          range: z.string(),
          count: z.number(),
        })
      ),
      dailyMatchings: z.array(
        z.object({
          date: z.string(),
          count: z.number(),
        })
      ),
    })
    .optional(),
});

// 개별 고객 리포트 요청 스키마
export const customerReportSchema = z.object({
  customerId: z.string().uuid('올바른 고객 ID가 아닙니다'),
});

// 개별 고객 리포트 데이터 스키마
export const customerReportDataSchema = z.object({
  // 고객 기본 정보
  customer: z.object({
    id: z.string(),
    name: z.string(),
    industry: z.string().optional(),
    location: z.string().optional(),
    challenges: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
    createdAt: z.string(),
  }),

  // 리포트 생성 정보
  generatedAt: z.string(),

  // 매칭 요약
  matchingSummary: z.object({
    totalMatchings: z.number(),
    avgScore: z.number(),
    topScore: z.number(),
    matchedKeywords: z.array(z.string()), // 매칭된 모든 키워드
  }),

  // 매칭된 프로그램 목록
  matchedPrograms: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      dataSource: z.string(),
      score: z.number(),
      matchedKeywords: z.array(z.string()),
      matchedIndustry: z.boolean(),
      matchedLocation: z.boolean(),
      deadline: z.string().nullable(),
      status: z.string(), // '진행중', '마감임박', '마감'
    })
  ),

  // 관심 프로그램 목록
  watchlistPrograms: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      dataSource: z.string(),
      deadline: z.string().nullable(),
      status: z.string(),
      addedAt: z.string(),
    })
  ),

  // 키워드 분석
  keywordAnalysis: z.object({
    // 가장 많이 매칭된 키워드
    topKeywords: z.array(
      z.object({
        keyword: z.string(),
        count: z.number(),
      })
    ),
    // 데이터소스별 매칭 분포
    byDataSource: z.array(
      z.object({
        dataSource: z.string(),
        count: z.number(),
        avgScore: z.number(),
      })
    ),
  }),

  // 진행사업 요약
  projectSummary: z
    .object({
      total: z.number(),
      inProgress: z.number(), // 서류준비, 신청완료, 심사중
      completed: z.number(), // 선정, 완료
      ended: z.number(), // 탈락, 취소/보류
    })
    .optional(),

  // 진행사업 목록
  projects: z
    .array(
      z.object({
        id: z.string(),
        programId: z.string(),
        title: z.string(),
        dataSource: z.string(),
        status: z.string(), // preparing, submitted, reviewing, selected, rejected, cancelled, completed
        statusLabel: z.string(), // 서류준비, 신청완료 등
        deadline: z.string().nullable(),
        deadlineStatus: z.string(), // active, closing, closed
        startedAt: z.string(),
        submittedAt: z.string().nullable(),
        resultAt: z.string().nullable(),
      })
    )
    .optional(),
});

// 타입 추출
export type GenerateReportRequest = z.infer<typeof generateReportSchema>;
export type ReportData = z.infer<typeof reportDataSchema>;
export type CustomerReportRequest = z.infer<typeof customerReportSchema>;
export type CustomerReportData = z.infer<typeof customerReportDataSchema>;
