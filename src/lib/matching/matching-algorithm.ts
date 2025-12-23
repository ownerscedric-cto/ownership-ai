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

import { createClient } from '@/lib/supabase/server';
import { MATCHING_CONFIG } from '@/lib/types/matching';
import type { MatchingOptions, MatchingScoreBreakdown } from '@/lib/types/matching';

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
 * 고객의 키워드와 프로그램의 키워드가 일치하는지 확인
 * 통합된 keywords 필드 사용 (도전과제, 목표, 선호 지원 유형 통합)
 *
 * @param customerKeywords - 고객 키워드 배열 (통합된 필드)
 * @param programKeywords - 프로그램 키워드 배열
 * @returns 일치한 키워드 목록
 */
export function matchKeywords(customerKeywords: string[], programKeywords: string[]): string[] {
  if (programKeywords.length === 0 || customerKeywords.length === 0) {
    return [];
  }

  // 키워드 매칭 (대소문자 무시, 부분 일치)
  const matchedKeywords: string[] = [];

  for (const programKeyword of programKeywords) {
    const programKeywordLower = programKeyword.toLowerCase();

    // 고객 키워드와 프로그램 키워드 매칭
    const isMatch = customerKeywords.some(
      customerKeyword =>
        customerKeyword.toLowerCase().includes(programKeywordLower) ||
        programKeywordLower.includes(customerKeyword.toLowerCase())
    );

    if (isMatch) {
      matchedKeywords.push(programKeyword);
    }
  }

  return matchedKeywords;
}

/**
 * 매칭 점수 계산
 *
 * @param matchedIndustry - 업종 일치 여부
 * @param matchedLocation - 지역 일치 여부
 * @param matchedKeywordsCount - 일치한 키워드 수
 * @returns 매칭 점수 구성 (0-100점)
 */
export function calculateScore(
  matchedIndustry: boolean,
  matchedLocation: boolean,
  matchedKeywordsCount: number
): MatchingScoreBreakdown {
  // 업종 점수: 30점
  const industryScore = matchedIndustry ? MATCHING_CONFIG.WEIGHTS.INDUSTRY : 0;

  // 지역 점수: 30점
  const locationScore = matchedLocation ? MATCHING_CONFIG.WEIGHTS.LOCATION : 0;

  // 키워드 점수: 키워드당 10점 (최대 40점)
  const keywordScore = Math.min(
    matchedKeywordsCount * MATCHING_CONFIG.WEIGHTS.KEYWORD_BASE,
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

  const supabase = await createClient();

  // 1. 고객 정보 조회
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, industry, location, keywords')
    .eq('id', customerId)
    .single();

  if (customerError || !customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  console.log('[Matching] 📋 Customer data:', {
    id: customer.id,
    industry: customer.industry,
    location: customer.location,
    keywords: customer.keywords,
  });

  // 2. 기존 매칭 결과 삭제 (forceRefresh = true인 경우)
  if (forceRefresh) {
    await supabase.from('matching_results').delete().eq('customerId', customerId);
  }

  // 3. 모든 활성 프로그램 조회
  const { data: programs } = await supabase
    .from('programs')
    .select(
      'id, title, description, category, targetAudience, targetLocation, keywords, budgetRange, deadline, sourceUrl, dataSource'
    )
    .eq('syncStatus', 'active');

  console.log(`[Matching] 📚 Total active programs: ${programs?.length || 0}`);

  // 4. 각 프로그램에 대해 매칭 점수 계산
  const matchingResults = [];
  let programsWithScore = 0;

  for (const program of programs || []) {
    // 업종 일치 여부
    const matchedIndustry = matchIndustry(customer.industry, program.targetAudience);

    // 지역 일치 여부
    const matchedLocation = matchLocation(customer.location, program.targetLocation);

    // 키워드 일치 여부 (통합된 keywords 필드 사용)
    const matchedKeywordsList = matchKeywords(customer.keywords || [], program.keywords || []);

    // 점수 계산
    const scoreBreakdown = calculateScore(
      matchedIndustry,
      matchedLocation,
      matchedKeywordsList.length
    );

    // 첫 3개 프로그램의 상세 매칭 결과 로깅
    if (programsWithScore < 3) {
      console.log(`[Matching] 🎯 Program ${programsWithScore + 1}:`, {
        title: program.title,
        targetAudience: program.targetAudience,
        targetLocation: program.targetLocation,
        keywords: program.keywords,
        matchedIndustry,
        matchedLocation,
        matchedKeywords: matchedKeywordsList,
        score: scoreBreakdown.totalScore,
      });
    }
    programsWithScore++;

    // 최소 점수 이상인 경우만 저장
    if (scoreBreakdown.totalScore >= minScore) {
      matchingResults.push({
        customerId: customer.id,
        programId: program.id,
        score: scoreBreakdown.totalScore,
        matchedIndustry,
        matchedLocation,
        matchedKeywords: matchedKeywordsList,
      });
    }
  }

  console.log(`[Matching] ✅ Programs with score ≥${minScore}: ${matchingResults.length}`);

  // 5. 점수 내림차순 정렬 후 상위 maxResults개 선택
  matchingResults.sort((a, b) => b.score - a.score);
  const topResults = matchingResults.slice(0, maxResults);

  // 6. DB에 매칭 결과 저장 (upsert)
  // Supabase에서는 upsert를 직접 지원하므로 간단하게 처리
  console.log(`[Matching] 💾 Saving ${topResults.length} results to DB...`);

  for (const result of topResults) {
    const { error: upsertError } = await supabase.from('matching_results').upsert(
      {
        id: crypto.randomUUID(), // UUID 생성
        customerId: result.customerId,
        programId: result.programId,
        score: result.score,
        matchedIndustry: result.matchedIndustry,
        matchedLocation: result.matchedLocation,
        matchedKeywords: result.matchedKeywords,
      },
      {
        onConflict: 'customerId,programId',
        ignoreDuplicates: false, // 중복 시 기존 데이터 업데이트
      }
    );

    if (upsertError) {
      console.error('[Matching] ❌ Upsert error:', upsertError);
      console.error('[Matching] Failed record:', result);
    }
  }

  console.log('[Matching] ✅ DB save completed');

  // 7. 저장된 매칭 결과 조회 (프로그램 상세 정보 포함)
  const { data: savedResults } = await supabase
    .from('matching_results')
    .select(
      `
      *,
      program:programs (
        id,
        title,
        description,
        category,
        targetAudience,
        targetLocation,
        keywords,
        budgetRange,
        deadline,
        sourceUrl,
        dataSource
      )
    `
    )
    .eq('customerId', customerId)
    .order('score', { ascending: false });

  return savedResults || [];
}
