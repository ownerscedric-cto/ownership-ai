/**
 * @file /api/analytics/report/route.ts
 * @description 활동 리포트 데이터 생성 API
 * Phase 6: 대시보드 및 분석
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { generateReportSchema, type ReportData } from '@/lib/validations/report';

/**
 * POST /api/analytics/report
 * 활동 리포트 데이터 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const parseResult = generateReportSchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력값이 올바르지 않습니다',
        parseResult.error.issues,
        400
      );
    }

    const { startDate, endDate, includeCustomers, includePrograms, includeMatchings } =
      parseResult.data;

    // 날짜 유효성 검사
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '시작일이 종료일보다 늦을 수 없습니다',
        null,
        400
      );
    }

    // 기간 설정
    const startIso = `${startDate}T00:00:00.000Z`;
    const endIso = `${endDate}T23:59:59.999Z`;

    // 병렬로 통계 쿼리 실행
    const [
      totalCustomersResult,
      newCustomersResult,
      totalProgramsResult,
      activeProgramsResult,
      totalMatchingsResult,
      newMatchingsResult,
      customersByIndustryResult,
      topCustomersResult,
      programsBySourceResult,
      topProgramsResult,
      matchingScoresResult,
      dailyMatchingsResult,
    ] = await Promise.all([
      // 총 고객 수
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('userId', user.id),

      // 기간 내 신규 고객
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('userId', user.id)
        .gte('createdAt', startIso)
        .lte('createdAt', endIso),

      // 총 프로그램 수
      supabase.from('programs').select('id', { count: 'exact', head: true }),

      // 진행중인 프로그램
      supabase
        .from('programs')
        .select('id', { count: 'exact', head: true })
        .or(`deadline.is.null,deadline.gte.${new Date().toISOString()}`),

      // 총 매칭 수
      supabase
        .from('matching_results')
        .select('id, customer:customers!inner(userId)', { count: 'exact', head: true })
        .eq('customer.userId', user.id),

      // 기간 내 신규 매칭
      supabase
        .from('matching_results')
        .select('id, customer:customers!inner(userId)', { count: 'exact', head: true })
        .eq('customer.userId', user.id)
        .gte('createdAt', startIso)
        .lte('createdAt', endIso),

      // 업종별 고객 수 (includeCustomers일 때만 사용)
      includeCustomers
        ? supabase.from('customers').select('industry').eq('userId', user.id)
        : Promise.resolve({ data: null }),

      // Top 고객 (includeCustomers일 때만 사용)
      includeCustomers
        ? supabase
            .from('matching_results')
            .select(
              'customerId, score, matchedKeywords, customer:customers!inner(name, industry, userId)'
            )
            .eq('customer.userId', user.id)
        : Promise.resolve({ data: null }),

      // 데이터소스별 프로그램 수 (includePrograms일 때만 사용)
      includePrograms
        ? (async () => {
            const dataSources = ['K-Startup', '기업마당', 'KOCCA-Finance', 'KOCCA-PIMS'];
            const counts = await Promise.all(
              dataSources.map(async source => {
                const { count } = await supabase
                  .from('programs')
                  .select('id', { count: 'exact', head: true })
                  .eq('dataSource', source);
                return { dataSource: source, count: count || 0 };
              })
            );
            return { data: counts.filter(c => c.count > 0) };
          })()
        : Promise.resolve({ data: null }),

      // Top 프로그램 (includePrograms일 때만 사용)
      includePrograms
        ? supabase
            .from('matching_results')
            .select('programId, program:programs(title)')
            .not('program', 'is', null)
        : Promise.resolve({ data: null }),

      // 매칭 점수 분포 (includeMatchings일 때만 사용)
      includeMatchings
        ? supabase
            .from('matching_results')
            .select('score, customer:customers!inner(userId)')
            .eq('customer.userId', user.id)
            .gte('createdAt', startIso)
            .lte('createdAt', endIso)
        : Promise.resolve({ data: null }),

      // 일별 매칭 수 (includeMatchings일 때만 사용)
      includeMatchings
        ? supabase
            .from('matching_results')
            .select('createdAt, customer:customers!inner(userId)')
            .eq('customer.userId', user.id)
            .gte('createdAt', startIso)
            .lte('createdAt', endIso)
            .order('createdAt', { ascending: true })
        : Promise.resolve({ data: null }),
    ]);

    // 리포트 데이터 구성
    const reportData: ReportData = {
      period: {
        startDate,
        endDate,
        generatedAt: new Date().toISOString(),
      },
      summary: {
        totalCustomers: totalCustomersResult.count || 0,
        newCustomers: newCustomersResult.count || 0,
        totalPrograms: totalProgramsResult.count || 0,
        activePrograms: activeProgramsResult.count || 0,
        totalMatchings: totalMatchingsResult.count || 0,
        newMatchings: newMatchingsResult.count || 0,
      },
    };

    // 고객 통계 추가
    if (includeCustomers && customersByIndustryResult.data) {
      const industryMap = new Map<string, number>();
      customersByIndustryResult.data.forEach(c => {
        const industry = c.industry || '미분류';
        industryMap.set(industry, (industryMap.get(industry) || 0) + 1);
      });

      // 고객별 매칭 통계 (키워드 포함)
      const customerStats = new Map<
        string,
        {
          name: string;
          industry: string;
          count: number;
          totalScore: number;
          keywords: Set<string>;
        }
      >();

      if (topCustomersResult.data) {
        topCustomersResult.data.forEach(m => {
          const customer = m.customer as unknown as { name: string; industry?: string } | null;
          if (customer && typeof customer === 'object' && 'name' in customer) {
            const existing = customerStats.get(m.customerId);
            const matchedKeywords = (m.matchedKeywords as string[]) || [];
            const score = (m.score as number) || 0;

            if (existing) {
              existing.count++;
              existing.totalScore += score;
              matchedKeywords.forEach(kw => existing.keywords.add(kw));
            } else {
              customerStats.set(m.customerId, {
                name: customer.name,
                industry: customer.industry || '미분류',
                count: 1,
                totalScore: score,
                keywords: new Set(matchedKeywords),
              });
            }
          }
        });
      }

      // 고객별 키워드 통계 (상위 10명)
      const customerKeywords = Array.from(customerStats.entries())
        .map(([customerId, stats]) => ({
          customerId,
          customerName: stats.name,
          industry: stats.industry,
          matchedKeywords: Array.from(stats.keywords).slice(0, 10),
          matchCount: stats.count,
          avgScore: Math.round((stats.totalScore / stats.count) * 10) / 10,
        }))
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 10);

      reportData.customerStats = {
        byIndustry: Array.from(industryMap.entries())
          .map(([industry, count]) => ({ industry, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        topCustomers: Array.from(customerStats.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map(c => ({ name: c.name, matchCount: c.count })),
        customerKeywords,
      };
    }

    // 프로그램 통계 추가
    if (includePrograms && programsBySourceResult.data) {
      const programCounts = new Map<string, { title: string; count: number }>();
      if (topProgramsResult.data) {
        topProgramsResult.data.forEach(m => {
          const program = m.program as unknown as { title: string } | null;
          if (program && typeof program === 'object' && 'title' in program) {
            const existing = programCounts.get(m.programId);
            if (existing) {
              existing.count++;
            } else {
              programCounts.set(m.programId, { title: program.title, count: 1 });
            }
          }
        });
      }

      reportData.programStats = {
        byDataSource: programsBySourceResult.data as Array<{ dataSource: string; count: number }>,
        topPrograms: Array.from(programCounts.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map(p => ({ title: p.title, matchCount: p.count })),
      };
    }

    // 매칭 통계 추가
    if (includeMatchings && matchingScoresResult.data) {
      const scores = matchingScoresResult.data.map(m => m.score);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      // 점수 분포
      const scoreRanges = [
        { range: '0-30', min: 0, max: 30, count: 0 },
        { range: '31-50', min: 31, max: 50, count: 0 },
        { range: '51-70', min: 51, max: 70, count: 0 },
        { range: '71-85', min: 71, max: 85, count: 0 },
        { range: '86-100', min: 86, max: 100, count: 0 },
      ];
      scores.forEach(score => {
        const range = scoreRanges.find(r => score >= r.min && score <= r.max);
        if (range) range.count++;
      });

      // 일별 매칭 수
      const dailyMap = new Map<string, number>();
      if (dailyMatchingsResult.data) {
        dailyMatchingsResult.data.forEach(m => {
          const date = m.createdAt.split('T')[0];
          dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
        });
      }

      reportData.matchingStats = {
        averageScore: Math.round(avgScore * 10) / 10,
        scoreDistribution: scoreRanges.map(r => ({ range: r.range, count: r.count })),
        dailyMatchings: Array.from(dailyMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      };
    }

    return successResponse(reportData);
  } catch (error) {
    console.error('[POST /api/analytics/report] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '리포트 생성 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}
