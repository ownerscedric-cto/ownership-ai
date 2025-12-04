/**
 * @file /api/programs/route.ts
 * @description 정부지원사업 프로그램 목록 조회 API
 * Phase 3: 다중 API 통합 연동
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createErrorResponse, logError } from '@/lib/utils/error-handler';

const prisma = new PrismaClient();

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
 * - keyword: 키워드 검색
 *
 * 핵심 기능:
 * - ⭐ 교차 정렬: registeredAt 기준 내림차순 정렬 (최신순)
 * - 출처별 분포 통계 포함
 * - 페이지네이션
 * - 필터링
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

    // Prisma where 조건 구성
    const where: {
      dataSource?: string | { in: string[] };
      category?: string;
      targetAudience?: { has: string };
      targetLocation?: { has: string };
      OR?: Array<{ title?: { contains: string }; keywords?: { has: string } }>;
    } = {};

    if (dataSource) {
      // "한국콘텐츠진흥원" 선택 시 KOCCA-PIMS와 KOCCA-Finance 둘 다 조회
      if (dataSource === '한국콘텐츠진흥원') {
        where.dataSource = {
          in: ['KOCCA-PIMS', 'KOCCA-Finance'],
        };
      } else {
        where.dataSource = dataSource;
      }
    }

    if (category) {
      where.category = category;
    }

    if (targetAudience) {
      where.targetAudience = { has: targetAudience };
    }

    if (targetLocation) {
      where.targetLocation = { has: targetLocation };
    }

    if (keyword) {
      where.OR = [{ title: { contains: keyword } }, { keywords: { has: keyword } }];
    }

    // 전체 개수 조회
    const total = await prisma.program.count({ where });

    // ⭐ 교차 정렬: registeredAt 기준 내림차순 정렬 (최신순)
    const programs = await prisma.program.findMany({
      where,
      orderBy: {
        registeredAt: 'desc', // ⭐ 등록일 기준 최신순 (교차 노출)
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 출처별 분포 통계 계산 (현재 페이지의 데이터)
    // KOCCA-PIMS와 KOCCA-Finance는 "한국콘텐츠진흥원"으로 통합
    const sourceDistribution = programs.reduce(
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
      `[GET /api/programs] Fetched ${programs.length} programs (page ${page}, limit ${limit})`
    );

    // 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: programs,
        metadata: {
          total,
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
  } finally {
    await prisma.$disconnect();
  }
}
