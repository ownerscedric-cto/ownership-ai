/**
 * @file /api/analytics/trends/route.ts
 * @description 시계열 트렌드 데이터 API
 * Phase 6: 대시보드 및 분석
 */

import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import {
  trendsQuerySchema,
  type TrendData,
  type TrendDataPoint,
} from '@/lib/validations/analytics';

/**
 * GET /api/analytics/trends
 * 시계열 트렌드 데이터 조회 (일별/주별/월별)
 *
 * Query Parameters:
 * - period: 'daily' | 'weekly' | 'monthly' (default: 'weekly')
 * - days: number (7-365, default: 30)
 */
export async function GET(request: Request) {
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

    // Query 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const queryResult = trendsQuerySchema.safeParse({
      period: searchParams.get('period') || 'weekly',
      days: searchParams.get('days') || '30',
    });

    if (!queryResult.success) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '잘못된 요청 파라미터입니다',
        queryResult.error.flatten(),
        400
      );
    }

    const { period, days } = queryResult.data;
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // 기간별 그룹화 함수
    const getDateKey = (date: Date): string => {
      if (period === 'daily') {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'weekly') {
        // 주의 시작일 (월요일) 기준
        const dayOfWeek = date.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일로 조정
        const monday = new Date(date);
        monday.setDate(date.getDate() + diff);
        return monday.toISOString().split('T')[0];
      } else {
        // monthly
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      }
    };

    // 병렬로 데이터 조회
    const [customersResult, matchingsResult, programsResult] = await Promise.all([
      // 기간 내 등록된 고객
      supabase
        .from('customers')
        .select('createdAt')
        .eq('userId', user.id)
        .gte('createdAt', startDate.toISOString())
        .order('createdAt', { ascending: true }),

      // 기간 내 생성된 매칭 결과
      supabase
        .from('matching_results')
        .select('createdAt, customer:customers!inner(userId)')
        .eq('customer.userId', user.id)
        .gte('createdAt', startDate.toISOString())
        .order('createdAt', { ascending: true }),

      // 기간 내 등록된 프로그램 (전체)
      supabase
        .from('programs')
        .select('createdAt')
        .gte('createdAt', startDate.toISOString())
        .order('createdAt', { ascending: true }),
    ]);

    // 날짜별 집계 맵 초기화
    const dateMap = new Map<string, TrendDataPoint>();

    // 기간 내 모든 날짜 키 생성
    const tempDate = new Date(startDate);
    while (tempDate <= now) {
      const key = getDateKey(tempDate);
      if (!dateMap.has(key)) {
        dateMap.set(key, {
          date: key,
          customers: 0,
          matchings: 0,
          programs: 0,
        });
      }

      // 다음 날짜로 이동
      if (period === 'daily') {
        tempDate.setDate(tempDate.getDate() + 1);
      } else if (period === 'weekly') {
        tempDate.setDate(tempDate.getDate() + 7);
      } else {
        tempDate.setMonth(tempDate.getMonth() + 1);
      }
    }

    // 고객 데이터 집계
    if (customersResult.data) {
      customersResult.data.forEach(item => {
        const date = new Date(item.createdAt);
        const key = getDateKey(date);
        const point = dateMap.get(key);
        if (point) {
          point.customers++;
        }
      });
    }

    // 매칭 데이터 집계
    if (matchingsResult.data) {
      matchingsResult.data.forEach(item => {
        const date = new Date(item.createdAt);
        const key = getDateKey(date);
        const point = dateMap.get(key);
        if (point) {
          point.matchings++;
        }
      });
    }

    // 프로그램 데이터 집계
    if (programsResult.data) {
      programsResult.data.forEach(item => {
        const date = new Date(item.createdAt);
        const key = getDateKey(date);
        const point = dateMap.get(key);
        if (point) {
          point.programs++;
        }
      });
    }

    // 결과 정렬 및 반환
    const trendData: TrendData = {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      data: Array.from(dateMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    };

    return successResponse(trendData);
  } catch (error) {
    console.error('[GET /api/analytics/trends] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '트렌드 데이터 조회 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}
