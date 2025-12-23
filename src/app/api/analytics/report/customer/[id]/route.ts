/**
 * @file /api/analytics/report/customer/[id]/route.ts
 * @description 개별 고객 리포트 데이터 생성 API
 * Phase 6: 대시보드 및 분석
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import type { CustomerReportData } from '@/lib/validations/report';

/**
 * 프로그램 상태 계산
 */
function getProgramStatus(deadline: string | null): string {
  if (!deadline) return '진행중';

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '마감';
  if (diffDays <= 7) return '마감임박';
  return '진행중';
}

/**
 * GET /api/analytics/report/customer/[id]
 * 개별 고객 리포트 데이터 생성
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: customerId } = await params;
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 고객 정보 조회 (소유권 확인 포함)
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('userId', user.id)
      .single();

    if (customerError || !customer) {
      return errorResponse(ErrorCode.NOT_FOUND, '고객을 찾을 수 없습니다', null, 404);
    }

    // 매칭 결과 조회 (프로그램 정보 포함)
    const { data: matchingResults, error: matchingError } = await supabase
      .from('matching_results')
      .select(
        `
        id,
        score,
        matchedIndustry,
        matchedLocation,
        matchedKeywords,
        createdAt,
        program:programs(
          id,
          title,
          dataSource,
          deadline,
          keywords
        )
      `
      )
      .eq('customerId', customerId)
      .order('score', { ascending: false });

    if (matchingError) {
      console.error('[Customer Report] Matching query error:', matchingError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '매칭 데이터 조회 실패', null, 500);
    }

    // 관심 프로그램 조회
    const { data: watchlistItems, error: watchlistError } = await supabase
      .from('customer_programs')
      .select(
        `
        id,
        createdAt,
        program:programs(
          id,
          title,
          dataSource,
          deadline
        )
      `
      )
      .eq('customerId', customerId)
      .order('createdAt', { ascending: false });

    if (watchlistError) {
      console.error('[Customer Report] Watchlist query error:', watchlistError);
    }

    // 매칭 통계 계산
    const matchings = matchingResults || [];
    const allKeywords: string[] = [];
    const keywordCounts = new Map<string, number>();
    const dataSourceStats = new Map<string, { count: number; totalScore: number }>();

    matchings.forEach(m => {
      const keywords = m.matchedKeywords || [];
      keywords.forEach((kw: string) => {
        allKeywords.push(kw);
        keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
      });

      const program = m.program as { dataSource?: string } | null;
      if (program?.dataSource) {
        const ds = program.dataSource;
        const existing = dataSourceStats.get(ds) || { count: 0, totalScore: 0 };
        dataSourceStats.set(ds, {
          count: existing.count + 1,
          totalScore: existing.totalScore + m.score,
        });
      }
    });

    const scores = matchings.map(m => m.score);
    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;
    const topScore = scores.length > 0 ? Math.max(...scores) : 0;

    // 매칭된 프로그램 목록 구성
    const matchedPrograms = matchings
      .filter(m => m.program)
      .map(m => {
        const program = m.program as unknown as {
          id: string;
          title: string;
          dataSource: string;
          deadline: string | null;
        };
        return {
          id: program.id,
          title: program.title,
          dataSource: program.dataSource,
          score: m.score,
          matchedKeywords: (m.matchedKeywords as string[]) || [],
          matchedIndustry: m.matchedIndustry,
          matchedLocation: m.matchedLocation,
          deadline: program.deadline,
          status: getProgramStatus(program.deadline),
        };
      });

    // 관심 프로그램 목록 구성
    const watchlistPrograms = (watchlistItems || [])
      .filter(w => w.program)
      .map(w => {
        const program = w.program as unknown as {
          id: string;
          title: string;
          dataSource: string;
          deadline: string | null;
        };
        return {
          id: program.id,
          title: program.title,
          dataSource: program.dataSource,
          deadline: program.deadline,
          status: getProgramStatus(program.deadline),
          addedAt: w.createdAt,
        };
      });

    // Top 키워드 (상위 10개)
    const topKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // 데이터소스별 통계
    const byDataSource = Array.from(dataSourceStats.entries())
      .map(([dataSource, stats]) => ({
        dataSource,
        count: stats.count,
        avgScore: Math.round((stats.totalScore / stats.count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count);

    // 리포트 데이터 구성
    const reportData: CustomerReportData = {
      customer: {
        id: customer.id,
        name: customer.name,
        industry: customer.industry || undefined,
        location: customer.location || undefined,
        challenges: customer.challenges || undefined,
        goals: customer.goals || undefined,
        createdAt: customer.createdAt,
      },
      generatedAt: new Date().toISOString(),
      matchingSummary: {
        totalMatchings: matchings.length,
        avgScore,
        topScore,
        matchedKeywords: [...new Set(allKeywords)], // 중복 제거
      },
      matchedPrograms,
      watchlistPrograms,
      keywordAnalysis: {
        topKeywords,
        byDataSource,
      },
    };

    return successResponse(reportData);
  } catch (error) {
    console.error('[GET /api/analytics/report/customer/[id]] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '고객 리포트 생성 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}
