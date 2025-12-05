/**
 * @file matching-algorithm.ts
 * @description 규칙 기반 매칭 알고리즘 구현
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템
 *
 * 매칭 점수 계산 로직:
 * - 업종 일치: +30점
 * - 지역 일치: +30점
 * - 키워드 일치: 기본 +10점, 선호 키워드 +15점 (최대 40점)
 * - 최소 30점 이상 (업종 또는 지역 최소 하나 일치 필수)
 * - 상위 50개 프로그램 선택
 */

import { PrismaClient } from '@prisma/client';
import { MATCHING_CONFIG } from '@/lib/types/matching';
import type { MatchingOptions, MatchingScoreBreakdown } from '@/lib/types/matching';

const prisma = new PrismaClient();

/**
 * 고객의 업종과 프로그램의 대상 업종이 일치하는지 확인
 *
 * @param customerIndustry - 고객 업종
 * @param programTargetAudience - 프로그램 대상 업종 배열
 * @returns 일치 여부
 */
export function matchIndustry(
  customerIndustry: string | null,
  programTargetAudience: string[]
): boolean {
  if (!customerIndustry) return false;
  if (programTargetAudience.length === 0) return false;

  // "전체" 키워드는 모든 업종과 일치
  if (programTargetAudience.includes('전체')) return true;

  // 고객 업종이 프로그램 대상 업종 배열에 포함되는지 확인
  return programTargetAudience.some(audience =>
    audience.toLowerCase().includes(customerIndustry.toLowerCase())
  );
}

/**
 * 고객의 지역과 프로그램의 대상 지역이 일치하는지 확인
 *
 * @param customerLocation - 고객 지역
 * @param programTargetLocation - 프로그램 대상 지역 배열
 * @returns 일치 여부
 */
export function matchLocation(
  customerLocation: string | null,
  programTargetLocation: string[]
): boolean {
  if (!customerLocation) return false;
  if (programTargetLocation.length === 0) return false;

  // "전국" 키워드는 모든 지역과 일치
  if (programTargetLocation.includes('전국')) return true;

  // 고객 지역이 프로그램 대상 지역 배열에 포함되는지 확인
  return programTargetLocation.some(location =>
    location.toLowerCase().includes(customerLocation.toLowerCase())
  );
}

/**
 * 고객의 니즈(challenges/goals)와 프로그램의 키워드가 일치하는지 확인
 * 선호 키워드(영업자가 선택한 프로그램 기반)는 가중치 +50% 적용
 *
 * @param customerChallenges - 고객 challenges
 * @param customerGoals - 고객 goals
 * @param customerPreferredKeywords - 고객 선호 키워드 (영업자가 선택한 프로그램 기반)
 * @param programKeywords - 프로그램 키워드 배열
 * @returns 일치한 키워드 목록
 */
export function matchKeywords(
  customerChallenges: string[],
  customerGoals: string[],
  customerPreferredKeywords: string[],
  programKeywords: string[]
): { keywords: string[]; preferredKeywords: string[] } {
  if (programKeywords.length === 0) {
    return { keywords: [], preferredKeywords: [] };
  }

  // 고객 니즈 키워드 (challenges + goals)
  const customerNeedsKeywords = [...customerChallenges, ...customerGoals];

  // 기본 키워드 매칭 (대소문자 무시, 부분 일치)
  const matchedKeywords: string[] = [];
  const matchedPreferredKeywords: string[] = [];

  for (const programKeyword of programKeywords) {
    const programKeywordLower = programKeyword.toLowerCase();

    // 기본 키워드 매칭 (challenges, goals)
    const isBasicMatch = customerNeedsKeywords.some(needKeyword =>
      needKeyword.toLowerCase().includes(programKeywordLower)
    );

    // 선호 키워드 매칭 (preferredKeywords)
    const isPreferredMatch = customerPreferredKeywords.some(preferredKeyword =>
      preferredKeyword.toLowerCase().includes(programKeywordLower)
    );

    if (isPreferredMatch) {
      matchedPreferredKeywords.push(programKeyword);
    } else if (isBasicMatch) {
      matchedKeywords.push(programKeyword);
    }
  }

  return {
    keywords: matchedKeywords,
    preferredKeywords: matchedPreferredKeywords,
  };
}

/**
 * 매칭 점수 계산
 *
 * @param matchedIndustry - 업종 일치 여부
 * @param matchedLocation - 지역 일치 여부
 * @param matchedKeywords - 일치한 기본 키워드 수
 * @param matchedPreferredKeywords - 일치한 선호 키워드 수
 * @returns 매칭 점수 구성 (0-100점)
 */
export function calculateScore(
  matchedIndustry: boolean,
  matchedLocation: boolean,
  matchedKeywords: number,
  matchedPreferredKeywords: number
): MatchingScoreBreakdown {
  // 업종 점수: 30점
  const industryScore = matchedIndustry ? MATCHING_CONFIG.WEIGHTS.INDUSTRY : 0;

  // 지역 점수: 30점
  const locationScore = matchedLocation ? MATCHING_CONFIG.WEIGHTS.LOCATION : 0;

  // 키워드 점수: 기본 10점 + 선호 15점 (최대 40점)
  const basicKeywordScore = Math.min(
    matchedKeywords * MATCHING_CONFIG.WEIGHTS.KEYWORD_BASE,
    MATCHING_CONFIG.WEIGHTS.KEYWORD_MAX
  );
  const preferredKeywordScore = Math.min(
    matchedPreferredKeywords * MATCHING_CONFIG.WEIGHTS.KEYWORD_PREFERRED,
    MATCHING_CONFIG.WEIGHTS.KEYWORD_MAX
  );
  const keywordScore = Math.min(
    basicKeywordScore + preferredKeywordScore,
    MATCHING_CONFIG.WEIGHTS.KEYWORD_MAX
  );

  // 총 점수: 0-100점
  const totalScore = industryScore + locationScore + keywordScore;

  return {
    industryScore,
    locationScore,
    keywordScore,
    totalScore,
  };
}

/**
 * 고객에 대한 프로그램 매칭 실행
 *
 * @param options - 매칭 옵션 (customerId, minScore, maxResults)
 * @returns 매칭된 프로그램 목록 (점수 내림차순 정렬)
 */
export async function runMatching(options: MatchingOptions) {
  const {
    customerId,
    minScore = MATCHING_CONFIG.MIN_SCORE,
    maxResults = MATCHING_CONFIG.MAX_RESULTS,
    forceRefresh = false,
  } = options;

  // 1. 고객 정보 조회
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      industry: true,
      location: true,
      challenges: true,
      goals: true,
      preferredKeywords: true,
    },
  });

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  // 2. 기존 매칭 결과 삭제 (forceRefresh = true인 경우)
  if (forceRefresh) {
    await prisma.matchingResult.deleteMany({
      where: { customerId },
    });
  }

  // 3. 모든 활성 프로그램 조회
  const programs = await prisma.program.findMany({
    where: {
      syncStatus: 'active',
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      targetAudience: true,
      targetLocation: true,
      keywords: true,
      budgetRange: true,
      deadline: true,
      sourceUrl: true,
      dataSource: true,
    },
  });

  // 4. 각 프로그램에 대해 매칭 점수 계산
  const matchingResults = [];

  for (const program of programs) {
    // 업종 일치 여부
    const matchedIndustry = matchIndustry(customer.industry, program.targetAudience);

    // 지역 일치 여부
    const matchedLocation = matchLocation(customer.location, program.targetLocation);

    // 키워드 일치 여부
    const { keywords: matchedBasicKeywords, preferredKeywords: matchedPreferredKeywords } =
      matchKeywords(
        customer.challenges,
        customer.goals,
        customer.preferredKeywords,
        program.keywords
      );

    // 점수 계산
    const scoreBreakdown = calculateScore(
      matchedIndustry,
      matchedLocation,
      matchedBasicKeywords.length,
      matchedPreferredKeywords.length
    );

    // 최소 점수 이상인 경우만 저장
    if (scoreBreakdown.totalScore >= minScore) {
      matchingResults.push({
        customerId: customer.id,
        programId: program.id,
        score: scoreBreakdown.totalScore,
        matchedIndustry,
        matchedLocation,
        matchedKeywords: [...matchedBasicKeywords, ...matchedPreferredKeywords],
      });
    }
  }

  // 5. 점수 내림차순 정렬 후 상위 maxResults개 선택
  matchingResults.sort((a, b) => b.score - a.score);
  const topResults = matchingResults.slice(0, maxResults);

  // 6. DB에 매칭 결과 저장 (upsert)
  await prisma.$transaction(
    topResults.map(result =>
      prisma.matchingResult.upsert({
        where: {
          customerId_programId: {
            customerId: result.customerId,
            programId: result.programId,
          },
        },
        update: {
          score: result.score,
          matchedIndustry: result.matchedIndustry,
          matchedLocation: result.matchedLocation,
          matchedKeywords: result.matchedKeywords,
        },
        create: result,
      })
    )
  );

  // 7. 저장된 매칭 결과 조회 (프로그램 상세 정보 포함)
  const savedResults = await prisma.matchingResult.findMany({
    where: {
      customerId,
    },
    orderBy: {
      score: 'desc',
    },
    include: {
      program: {
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          targetAudience: true,
          targetLocation: true,
          keywords: true,
          budgetRange: true,
          deadline: true,
          sourceUrl: true,
          dataSource: true,
        },
      },
    },
  });

  return savedResults;
}
