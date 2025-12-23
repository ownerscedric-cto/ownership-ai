/**
 * @file /api/analytics/route.ts
 * @description 대시보드 통계 데이터 API
 * Phase 6: 대시보드 및 분석
 */

import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import type { DashboardStats } from '@/lib/validations/analytics';

/**
 * GET /api/analytics
 * 대시보드 전체 통계 데이터 조회
 */
export async function GET() {
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

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 병렬로 모든 통계 쿼리 실행
    const [
      customersResult,
      programsResult,
      activeProgramsResult,
      matchingsResult,
      recentCustomersResult,
      recentMatchingsResult,
      recentProgramsResult,
      topProgramsResult,
      topCustomersResult,
      programsBySourceResult,
      recentActivityResult,
    ] = await Promise.all([
      // 총 고객 수 (현재 사용자의 고객만)
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('userId', user.id),

      // 총 프로그램 수
      supabase.from('programs').select('id', { count: 'exact', head: true }),

      // 진행중인 프로그램 수 (마감일이 없거나 미래)
      supabase
        .from('programs')
        .select('id', { count: 'exact', head: true })
        .or(`deadline.is.null,deadline.gte.${now.toISOString()}`),

      // 총 매칭 수 (현재 사용자의 고객 매칭만)
      supabase
        .from('matching_results')
        .select('id, customer:customers!inner(userId)', { count: 'exact', head: true })
        .eq('customer.userId', user.id),

      // 최근 7일 신규 고객
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('userId', user.id)
        .gte('createdAt', sevenDaysAgo.toISOString()),

      // 최근 7일 매칭
      supabase
        .from('matching_results')
        .select('id, customer:customers!inner(userId)', { count: 'exact', head: true })
        .eq('customer.userId', user.id)
        .gte('createdAt', sevenDaysAgo.toISOString()),

      // 최근 7일 신규 프로그램
      supabase
        .from('programs')
        .select('id', { count: 'exact', head: true })
        .gte('createdAt', sevenDaysAgo.toISOString()),

      // 가장 많이 매칭된 프로그램 Top 5 (현재 사용자 기준)
      supabase.rpc('get_top_matched_programs', { p_user_id: user.id, p_limit: 5 }),

      // 가장 많은 매칭을 받은 고객 Top 5
      supabase.rpc('get_top_matched_customers', { p_user_id: user.id, p_limit: 5 }),

      // 데이터소스별 프로그램 수
      supabase.rpc('get_programs_by_source'),

      // 최근 활동 내역 (고객 + 매칭)
      getRecentActivity(supabase, user.id, 10),
    ]);

    // 에러 체크
    if (customersResult.error) {
      console.error('[GET /api/analytics] Customers error:', customersResult.error);
    }

    // RPC 함수가 없는 경우 대체 쿼리 사용
    let topPrograms: DashboardStats['topPrograms'] = [];
    let topCustomers: DashboardStats['topCustomers'] = [];
    let programsBySource: DashboardStats['programsBySource'] = [];

    // topPrograms 대체 쿼리
    if (topProgramsResult.error || !topProgramsResult.data) {
      const { data: matchingData } = await supabase
        .from('matching_results')
        .select(
          `
          programId,
          program:programs(id, title, dataSource)
        `
        )
        .not('program', 'is', null);

      if (matchingData) {
        const programCounts = new Map<
          string,
          { id: string; title: string; dataSource: string; count: number }
        >();
        matchingData.forEach(m => {
          // Supabase JOIN 결과는 단일 객체로 반환됨 (inner join 사용 시)
          const prog = m.program as unknown as {
            id: string;
            title: string;
            dataSource: string;
          } | null;
          if (prog && typeof prog === 'object' && 'id' in prog) {
            const existing = programCounts.get(prog.id);
            if (existing) {
              existing.count++;
            } else {
              programCounts.set(prog.id, {
                id: prog.id,
                title: prog.title,
                dataSource: prog.dataSource,
                count: 1,
              });
            }
          }
        });
        topPrograms = Array.from(programCounts.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            title: p.title,
            matchCount: p.count,
            dataSource: p.dataSource,
          }));
      }
    } else {
      topPrograms = topProgramsResult.data;
    }

    // topCustomers 대체 쿼리 - 매칭된 프로그램 중 진행중인 공고 수 기준
    if (topCustomersResult.error || !topCustomersResult.data) {
      const { data: customerMatchData } = await supabase
        .from('matching_results')
        .select(
          `
          customerId,
          customer:customers!inner(id, name, userId),
          program:programs!inner(id, deadline)
        `
        )
        .eq('customer.userId', user.id);

      if (customerMatchData) {
        const customerCounts = new Map<string, { id: string; name: string; activeCount: number }>();

        const nowIso = now.toISOString();

        customerMatchData.forEach(m => {
          const cust = m.customer as unknown as { id: string; name: string } | null;
          const prog = m.program as unknown as { id: string; deadline: string | null } | null;

          if (cust && typeof cust === 'object' && 'id' in cust) {
            // 진행중인 공고인지 확인 (마감일이 없거나 미래)
            const isActive = !prog?.deadline || prog.deadline >= nowIso;

            const existing = customerCounts.get(cust.id);
            if (existing) {
              if (isActive) existing.activeCount++;
            } else {
              customerCounts.set(cust.id, {
                id: cust.id,
                name: cust.name,
                activeCount: isActive ? 1 : 0,
              });
            }
          }
        });

        topCustomers = Array.from(customerCounts.values())
          .filter(c => c.activeCount > 0) // 진행중인 공고가 있는 고객만
          .sort((a, b) => b.activeCount - a.activeCount)
          .slice(0, 5)
          .map(c => ({
            id: c.id,
            name: c.name,
            companyName: null,
            matchCount: c.activeCount,
          }));
      }
    } else {
      topCustomers = topCustomersResult.data;
    }

    // programsBySource 대체 쿼리 - 집계 쿼리 사용
    if (programsBySourceResult.error || !programsBySourceResult.data) {
      // 각 데이터소스별로 개별 카운트 쿼리 실행 (행 제한 없이 정확한 집계)
      const dataSources = ['K-Startup', '기업마당', 'KOCCA-Finance', 'KOCCA-PIMS'];
      const sourceCountPromises = dataSources.map(async source => {
        const { count } = await supabase
          .from('programs')
          .select('id', { count: 'exact', head: true })
          .eq('dataSource', source);
        return { dataSource: source, count: count || 0 };
      });

      const sourceCounts = await Promise.all(sourceCountPromises);
      programsBySource = sourceCounts.filter(s => s.count > 0).sort((a, b) => b.count - a.count);
    } else {
      programsBySource = programsBySourceResult.data;
    }

    const stats: DashboardStats = {
      totalCustomers: customersResult.count || 0,
      totalPrograms: programsResult.count || 0,
      totalMatchings: matchingsResult.count || 0,
      activePrograms: activeProgramsResult.count || 0,
      recentCustomers: recentCustomersResult.count || 0,
      recentMatchings: recentMatchingsResult.count || 0,
      recentPrograms: recentProgramsResult.count || 0,
      topPrograms,
      topCustomers,
      programsBySource,
      recentActivity: recentActivityResult,
    };

    return successResponse(stats);
  } catch (error) {
    console.error('[GET /api/analytics] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '통계 데이터 조회 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}

/**
 * 최근 활동 내역 조회
 */
async function getRecentActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  limit: number
): Promise<DashboardStats['recentActivity']> {
  try {
    // 최근 고객 등록
    const { data: recentCustomers } = await supabase
      .from('customers')
      .select('id, name, createdAt')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    // 최근 매칭 결과
    const { data: recentMatchings } = await supabase
      .from('matching_results')
      .select(
        `
        id,
        createdAt,
        score,
        customer:customers!inner(name, userId),
        program:programs(title)
      `
      )
      .eq('customer.userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    const activities: DashboardStats['recentActivity'] = [];

    // 고객 활동
    if (recentCustomers) {
      recentCustomers.forEach(c => {
        activities.push({
          type: 'customer',
          description: `새 고객 "${c.name}" 등록`,
          createdAt: c.createdAt,
        });
      });
    }

    // 매칭 활동
    if (recentMatchings) {
      recentMatchings.forEach(m => {
        // Supabase JOIN 결과는 단일 객체로 반환됨 (inner join 사용 시)
        const customer = m.customer as unknown as { name: string } | null;
        const program = m.program as unknown as { title: string } | null;
        if (
          customer &&
          typeof customer === 'object' &&
          'name' in customer &&
          program &&
          typeof program === 'object' &&
          'title' in program
        ) {
          activities.push({
            type: 'matching',
            description: `"${customer.name}"에게 "${program.title}" 매칭 (${Math.round(m.score)}점)`,
            createdAt: m.createdAt,
          });
        }
      });
    }

    // 최신순 정렬 후 상위 N개 반환
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('[getRecentActivity] Error:', error);
    return [];
  }
}
