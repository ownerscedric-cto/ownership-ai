/**
 * @file /api/programs/route.ts
 * @description 정부지원사업 프로그램 목록 조회 API
 * Phase 3: 다중 API 통합 연동
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createErrorResponse, logError } from '@/lib/utils/error-handler';

/**
 * GET /api/programs
 *
 * 정부지원사업 프로그램 목록 조회
 *
 * Query Parameters:
 * - page: 페이지 번호 (기본: 1)
 * - limit: 페이지당 개수 (기본: 20, 최대: 100)
 * - dataSource: 데이터 소스 필터 (기업마당, K-Startup, KOCCA-PIMS, KOCCA-Finance)
 * - category: 카테고리 필터
 * - targetAudience: 대상 업종 필터
 * - targetLocation: 대상 지역 필터
 * - keyword: 키워드 검색 (단일)
 * - keywords: 다중 키워드 검색 (콤마 구분)
 * - showActiveOnly: 진행중인 공고만 표시 (기본: true)
 *
 * 핵심 기능:
 * - ⭐ 교차 정렬: registeredAt 기준 내림차순 정렬 (최신순)
 * - 출처별 분포 통계 포함
 * - 페이지네이션
 * - 필터링
 * - 진행중인 공고만 필터링 (deadline 기반)
 *
 * 응답:
 * - success: true
 * - data: Program[]
 * - metadata: { total, page, limit, sourceDistribution }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Query Parameters 파싱
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const dataSource = searchParams.get('dataSource');
    const category = searchParams.get('category');
    const targetAudience = searchParams.get('targetAudience');
    const targetLocation = searchParams.get('targetLocation');
    const keyword = searchParams.get('keyword');
    const keywordsParam = searchParams.get('keywords');
    const keywords = keywordsParam
      ? keywordsParam
          .split(',')
          .map(k => k.trim())
          .filter(Boolean)
      : [];
    // showActiveOnly: 'false'일 때만 false, 그 외에는 기본값 true
    const showActiveOnly = searchParams.get('showActiveOnly') !== 'false';

    const supabase = await createClient();

    // Supabase 쿼리 구성
    let query = supabase.from('programs').select('*', { count: 'exact' });

    // 필터 적용
    if (dataSource) {
      // "한국콘텐츠진흥원" 선택 시 KOCCA-PIMS와 KOCCA-Finance 둘 다 조회
      if (dataSource === '한국콘텐츠진흥원') {
        query = query.in('dataSource', ['KOCCA-PIMS', 'KOCCA-Finance']);
      } else {
        query = query.eq('dataSource', dataSource);
      }
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (targetAudience) {
      query = query.contains('targetAudience', [targetAudience]);
    }

    if (targetLocation) {
      query = query.contains('targetLocation', [targetLocation]);
    }

    // 다중 키워드 검색 (AND 조건: 모든 키워드가 포함된 결과만)
    if (keywords.length > 0) {
      // 각 키워드에 대해 title 또는 keywords 배열에 포함되어야 함
      for (const kw of keywords) {
        query = query.or(`title.ilike.%${kw}%,keywords.cs.{${kw}}`);
      }
    } else if (keyword) {
      // 단일 키워드 검색 (하위 호환성)
      query = query.or(`title.ilike.%${keyword}%,keywords.cs.{${keyword}}`);
    }

    // 진행중인 공고만 필터링 (deadline이 현재 시간 이후이거나 null인 경우)
    if (showActiveOnly) {
      const now = new Date().toISOString();
      // deadline이 null이거나 현재 시간 이후인 경우만 표시
      query = query.or(`deadline.is.null,deadline.gte.${now}`);
    }

    // ⭐ 교차 정렬: registeredAt 기준 내림차순 정렬 (최신순)
    query = query.order('registeredAt', { ascending: false });

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: programs, error: fetchError, count: total } = await query;

    if (fetchError) {
      console.error('Programs fetch error:', fetchError);
      return NextResponse.json(createErrorResponse(fetchError), { status: 500 });
    }

    // 출처별 분포 통계 계산 (현재 페이지의 데이터)
    // KOCCA-PIMS와 KOCCA-Finance는 "한국콘텐츠진흥원"으로 통합
    const sourceDistribution = (programs || []).reduce(
      (acc: Record<string, number>, program: { dataSource: string }) => {
        const normalizedSource =
          program.dataSource === 'KOCCA-PIMS' || program.dataSource === 'KOCCA-Finance'
            ? '한국콘텐츠진흥원'
            : program.dataSource;

        acc[normalizedSource] = (acc[normalizedSource] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log(
      `[GET /api/programs] Fetched ${programs?.length || 0} programs (page ${page}, limit ${limit})`
    );

    // 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: programs || [],
        metadata: {
          total: total || 0,
          page,
          limit,
          sourceDistribution, // 출처별 분포
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // 에러 로깅 (심각도별 자동 분류)
    logError(error, { context: 'GET /api/programs', operation: 'fetch' });

    // 표준 에러 응답 생성
    const errorResponse = createErrorResponse(error);

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
