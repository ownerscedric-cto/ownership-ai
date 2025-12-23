/**
 * @file /api/customers/[id]/progress/route.ts
 * @description 고객별 사업진행현황 데이터 API
 * Phase 4: 사업진행현황 패널
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

/**
 * 프로그램 상태 계산
 */
function getProgramStatus(deadline: string | null): {
  status: 'active' | 'closing' | 'closed';
  label: string;
  daysLeft: number | null;
} {
  if (!deadline) {
    return { status: 'active', label: '상시모집', daysLeft: null };
  }

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'closed', label: '마감', daysLeft: diffDays };
  }
  if (diffDays <= 7) {
    return { status: 'closing', label: `D-${diffDays}`, daysLeft: diffDays };
  }
  return { status: 'active', label: '진행중', daysLeft: diffDays };
}

/**
 * GET /api/customers/[id]/progress
 * 고객별 사업진행현황 조회
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

    // 고객 소유권 확인
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', customerId)
      .eq('userId', user.id)
      .single();

    if (customerError || !customer) {
      return errorResponse(ErrorCode.NOT_FOUND, '고객을 찾을 수 없습니다', null, 404);
    }

    // 병렬로 데이터 조회
    const [matchingResultsResponse, watchlistResponse, projectsResponse] = await Promise.all([
      // 매칭 결과 (프로그램 정보 포함)
      supabase
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
            targetAudience
          )
        `
        )
        .eq('customerId', customerId)
        .order('score', { ascending: false }),

      // 관심 프로그램 (프로그램 정보 포함)
      supabase
        .from('customer_programs')
        .select(
          `
          id,
          addedAt,
          program:programs(
            id,
            title,
            dataSource,
            deadline
          )
        `
        )
        .eq('customerId', customerId)
        .order('addedAt', { ascending: false }),

      // 진행사업 (실제로 진행하기로 결정한 사업)
      supabase
        .from('customer_projects')
        .select(
          `
          id,
          status,
          notes,
          startedAt,
          submittedAt,
          resultAt,
          updatedAt,
          program:programs(
            id,
            title,
            dataSource,
            deadline
          )
        `
        )
        .eq('customerId', customerId)
        .order('startedAt', { ascending: false }),
    ]);

    if (matchingResultsResponse.error) {
      console.error('[Progress API] Matching query error:', matchingResultsResponse.error);
    }
    if (watchlistResponse.error) {
      console.error('[Progress API] Watchlist query error:', watchlistResponse.error);
    }
    if (projectsResponse.error) {
      console.error('[Progress API] Projects query error:', projectsResponse.error);
    }

    const matchingResults = matchingResultsResponse.data || [];
    const watchlistItems = watchlistResponse.data || [];
    const projectItems = projectsResponse.data || [];

    // 진행 중인 사업 (마감되지 않은 매칭 프로그램)
    const activePrograms = matchingResults
      .filter(m => m.program)
      .map(m => {
        const program = m.program as unknown as {
          id: string;
          title: string;
          dataSource: string;
          deadline: string | null;
          targetAudience: string | null;
        };
        const statusInfo = getProgramStatus(program.deadline);
        return {
          id: program.id,
          matchingId: m.id,
          title: program.title,
          dataSource: program.dataSource,
          deadline: program.deadline,
          score: m.score,
          matchedIndustry: m.matchedIndustry,
          matchedLocation: m.matchedLocation,
          matchedKeywords: (m.matchedKeywords as string[]) || [],
          matchedAt: m.createdAt,
          ...statusInfo,
        };
      })
      .filter(p => p.status !== 'closed');

    // 마감 임박 프로그램 (7일 이내)
    const closingPrograms = activePrograms
      .filter(p => p.status === 'closing')
      .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));

    // 최근 활동 (매칭 + 관심목록 추가)
    type ActivityItem = {
      type: 'matching' | 'watchlist';
      programId: string;
      programTitle: string;
      dataSource: string;
      score?: number;
      createdAt: string;
    };

    const activities: ActivityItem[] = [];

    // 매칭 활동
    matchingResults.forEach(m => {
      const program = m.program as unknown as {
        id: string;
        title: string;
        dataSource: string;
      } | null;
      if (program) {
        activities.push({
          type: 'matching',
          programId: program.id,
          programTitle: program.title,
          dataSource: program.dataSource,
          score: m.score,
          createdAt: m.createdAt,
        });
      }
    });

    // 관심목록 추가 활동
    watchlistItems.forEach(w => {
      const program = w.program as unknown as {
        id: string;
        title: string;
        dataSource: string;
      } | null;
      if (program) {
        activities.push({
          type: 'watchlist',
          programId: program.id,
          programTitle: program.title,
          dataSource: program.dataSource,
          createdAt: w.addedAt,
        });
      }
    });

    // 최신순 정렬 후 상위 10개
    const recentActivities = activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // 관심 프로그램 목록 (마감되지 않은 것만)
    const watchlistPrograms = watchlistItems
      .filter(w => w.program)
      .map(w => {
        const program = w.program as unknown as {
          id: string;
          title: string;
          dataSource: string;
          deadline: string | null;
        };
        const statusInfo = getProgramStatus(program.deadline);
        return {
          id: program.id,
          watchlistId: w.id,
          title: program.title,
          dataSource: program.dataSource,
          deadline: program.deadline,
          addedAt: w.addedAt,
          ...statusInfo,
        };
      })
      .filter(p => p.status !== 'closed');

    // 진행사업 상태 라벨 및 색상 매핑
    const PROJECT_STATUS_INFO: Record<string, { label: string; color: string }> = {
      preparing: { label: '서류준비', color: 'gray' },
      submitted: { label: '신청완료', color: 'blue' },
      reviewing: { label: '심사중', color: 'yellow' },
      selected: { label: '선정', color: 'green' },
      rejected: { label: '탈락', color: 'red' },
      cancelled: { label: '취소/보류', color: 'gray' },
      completed: { label: '완료', color: 'purple' },
    };

    // 진행사업 목록 처리
    const projects = projectItems
      .filter(p => p.program)
      .map(p => {
        const program = p.program as unknown as {
          id: string;
          title: string;
          dataSource: string;
          deadline: string | null;
        };
        const deadlineInfo = getProgramStatus(program.deadline);
        const statusInfo = PROJECT_STATUS_INFO[p.status] || { label: p.status, color: 'gray' };
        return {
          id: p.id,
          programId: program.id,
          title: program.title,
          dataSource: program.dataSource,
          deadline: program.deadline,
          deadlineStatus: deadlineInfo.status,
          deadlineLabel: deadlineInfo.label,
          daysLeft: deadlineInfo.daysLeft,
          status: p.status,
          statusLabel: statusInfo.label,
          statusColor: statusInfo.color,
          notes: p.notes,
          startedAt: p.startedAt,
          submittedAt: p.submittedAt,
          resultAt: p.resultAt,
          updatedAt: p.updatedAt,
        };
      });

    // 진행사업 상태별 분류
    const projectsByStatus = {
      inProgress: projects.filter(p => ['preparing', 'submitted', 'reviewing'].includes(p.status)),
      completed: projects.filter(p => ['selected', 'completed'].includes(p.status)),
      ended: projects.filter(p => ['rejected', 'cancelled'].includes(p.status)),
    };

    // 통계 계산
    const stats = {
      totalMatched: matchingResults.length,
      activeCount: activePrograms.length,
      closingCount: closingPrograms.length,
      watchlistCount: watchlistPrograms.length,
      avgScore:
        matchingResults.length > 0
          ? Math.round(
              (matchingResults.reduce((sum, m) => sum + m.score, 0) / matchingResults.length) * 10
            ) / 10
          : 0,
      // 진행사업 통계
      projectsTotal: projects.length,
      projectsInProgress: projectsByStatus.inProgress.length,
      projectsCompleted: projectsByStatus.completed.length,
      projectsEnded: projectsByStatus.ended.length,
    };

    return successResponse({
      customer: {
        id: customer.id,
        name: customer.name,
      },
      stats,
      activePrograms,
      closingPrograms,
      watchlistPrograms,
      recentActivities,
      // 진행사업 데이터
      projects,
      projectsByStatus,
    });
  } catch (error) {
    console.error('[GET /api/customers/[id]/progress] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '사업진행현황 조회 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}
