/**
 * @file MatchingResults.tsx
 * @description Matching results list component with accordion for details
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템 UI
 */

'use client';

import { useState } from 'react';
import { ChevronDown, CheckCircle2, XCircle, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMatchingResults } from '@/lib/hooks/useMatching';
import { useAddToWatchlist, useWatchlist, useRemoveFromWatchlist } from '@/lib/hooks/useWatchlist';
import { MatchingFilters } from './MatchingFilters';
import { DeadlineBadge } from '../programs/DeadlineBadge';
import { cn } from '@/lib/utils';
import { truncateText, decodeHtmlEntities } from '@/lib/utils/html';
import { toast } from 'sonner';
import Link from 'next/link';

interface MatchingResultsProps {
  customerId: string;
  className?: string;
}

/**
 * 데이터 소스 이름 정규화 함수
 * KOCCA-PIMS, KOCCA-Finance → 한국콘텐츠진흥원
 */
const normalizeDataSource = (dataSource: string): string => {
  if (dataSource === 'KOCCA-PIMS' || dataSource === 'KOCCA-Finance') {
    return '한국콘텐츠진흥원';
  }
  return dataSource;
};

/**
 * 데이터 소스별 Badge 색상 매핑
 */
const dataSourceColors: Record<string, string> = {
  기업마당: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'K-Startup': 'bg-green-100 text-green-800 hover:bg-green-200',
  한국콘텐츠진흥원: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  서울테크노파크: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  경기테크노파크: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
};

/**
 * 매칭 점수별 Badge 색상
 */
const getScoreBadgeColor = (score: number): string => {
  if (score >= 80) return 'bg-green-100 text-green-800 hover:bg-green-200';
  if (score >= 60) return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
  return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
};

/**
 * MatchingResults Component - List Layout with Accordion
 *
 * @example
 * <MatchingResults customerId="customer-id-123" />
 */
export function MatchingResults({ customerId, className }: MatchingResultsProps) {
  const [minScore, setMinScore] = useState(30);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  // 해당 고객의 watchlist 조회
  const { data: watchlistData } = useWatchlist(customerId);

  // watchlist에 있는 programId Set 생성 (빠른 조회용)
  const watchlistProgramIds = new Set(watchlistData?.items.map(item => item.programId) ?? []);

  const {
    data: results,
    isLoading,
    isError,
    error,
  } = useMatchingResults(customerId, {
    limit: 50,
    minScore,
  });

  // 아코디언 토글
  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 관심목록 토글 핸들러
  const handleToggleWatchlist = async (e: React.MouseEvent, programId: string) => {
    e.stopPropagation(); // 이벤트 전파 방지

    const isInWatchlist = watchlistProgramIds.has(programId);

    try {
      if (isInWatchlist) {
        // 관심목록에서 제거
        await removeFromWatchlist.mutateAsync({
          customerId,
          programId,
        });
        toast.success('관심 목록에서 제거되었습니다');
      } else {
        // 관심목록에 추가
        await addToWatchlist.mutateAsync({
          customerId,
          programId,
        });
        toast.success('관심 목록에 추가되었습니다');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('already')) {
        toast.info('이미 관심 목록에 있습니다');
      } else {
        toast.error('관심 목록 처리에 실패했습니다');
      }
    }
  };

  // Filter expired programs based on deadline
  const filteredResults = results?.filter(result => {
    if (!showActiveOnly) return true;

    // If no deadline, consider it active (always show)
    if (!result.program.deadline) return true;

    // Check if deadline is in the future
    const deadline = new Date(result.program.deadline);
    const now = new Date();
    return deadline >= now;
  });

  // Loading State - List Skeleton
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTitle>오류 발생</AlertTitle>
        <AlertDescription>
          {error?.message || '매칭 결과를 불러오는데 실패했습니다.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty State
  if (!results || results.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <MatchingFilters
          minScore={minScore}
          onMinScoreChange={setMinScore}
          showActiveOnly={showActiveOnly}
          onShowActiveOnlyChange={setShowActiveOnly}
        />
        <Alert>
          <AlertTitle>매칭 결과 없음</AlertTitle>
          <AlertDescription>
            {minScore > 30
              ? `최소 점수 ${minScore}점 이상의 매칭 결과가 없습니다. 필터를 조정해보세요.`
              : '매칭 결과가 없습니다. 매칭 실행 버튼을 클릭하여 매칭을 시작하세요.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty State after filtering
  if (!filteredResults || filteredResults.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <MatchingFilters
          minScore={minScore}
          onMinScoreChange={setMinScore}
          showActiveOnly={showActiveOnly}
          onShowActiveOnlyChange={setShowActiveOnly}
        />
        <Alert>
          <AlertTitle>필터 조건에 맞는 결과 없음</AlertTitle>
          <AlertDescription>
            진행중인 공고만 보기 필터를 해제하거나 최소 점수를 낮춰보세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <MatchingFilters
          minScore={minScore}
          onMinScoreChange={setMinScore}
          showActiveOnly={showActiveOnly}
          onShowActiveOnlyChange={setShowActiveOnly}
        />
        <p className="text-sm text-gray-600">
          총 <span className="font-semibold text-gray-900">{filteredResults.length}개</span>{' '}
          프로그램
          {showActiveOnly && results.length !== filteredResults.length && (
            <span className="text-gray-500 ml-1">(전체 {results.length}개 중 진행중)</span>
          )}
        </p>
      </div>

      {/* Results List */}
      <div className="space-y-2">
        {filteredResults.map(result => {
          const isExpanded = expandedIds.has(result.id);
          const isInWatchlist = watchlistProgramIds.has(result.program.id);

          // 설명 최대 200자 제한
          const truncatedDescription = result.program.description
            ? truncateText(result.program.description, 200)
            : null;

          return (
            <Collapsible
              key={result.id}
              open={isExpanded}
              onOpenChange={() => toggleExpanded(result.id)}
            >
              <div className="border rounded-lg hover:bg-gray-50 transition-colors">
                {/* 메인 row */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* 왼쪽: 프로그램 정보 */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/programs/${result.program.id}`}
                        className="text-base font-semibold text-gray-900 hover:text-[#0052CC] transition-colors line-clamp-1"
                      >
                        {decodeHtmlEntities(result.program.title)}
                      </Link>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          className={
                            dataSourceColors[normalizeDataSource(result.program.dataSource)] ||
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {normalizeDataSource(result.program.dataSource)}
                        </Badge>
                        <DeadlineBadge
                          deadline={result.program.deadline}
                          rawData={result.program.rawData}
                        />
                        <Badge className={getScoreBadgeColor(result.score)}>
                          {Math.round(result.score)}점
                        </Badge>
                      </div>

                      {/* 요약보기 버튼 */}
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 px-2 text-xs text-gray-600 hover:text-[#0052CC]"
                        >
                          <ChevronDown
                            className={cn(
                              'w-4 h-4 mr-1 transition-transform',
                              isExpanded && 'rotate-180'
                            )}
                          />
                          {isExpanded ? '접기' : '요약보기'}
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    {/* 오른쪽: 액션 버튼 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* 관심목록 토글 버튼 */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={e => handleToggleWatchlist(e, result.program.id)}
                        className={cn(
                          'h-8 w-8 p-0 transition-colors',
                          isInWatchlist
                            ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50'
                            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                        )}
                        title={isInWatchlist ? '관심 목록에서 제거' : '관심 목록에 추가'}
                        disabled={addToWatchlist.isPending || removeFromWatchlist.isPending}
                      >
                        <Star className={cn('w-4 h-4', isInWatchlist && 'fill-current')} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 아코디언 콘텐츠 - 요약 + 매칭 근거 */}
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3">
                    {/* 설명 */}
                    {truncatedDescription && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                        {truncatedDescription}
                      </div>
                    )}

                    {/* 매칭 근거 */}
                    <div className="border-l-2 border-[#0052CC] pl-3 py-2 bg-blue-50/50 rounded-r-lg">
                      <p className="text-xs font-semibold text-[#0052CC] mb-2">매칭 근거</p>
                      <div className="flex flex-col gap-1.5 text-sm">
                        {/* 업종 일치 */}
                        <div className="flex items-center gap-1.5">
                          {result.matchedIndustry ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400" />
                          )}
                          <span
                            className={
                              result.matchedIndustry
                                ? 'text-green-700 font-medium'
                                : 'text-gray-500'
                            }
                          >
                            업종 {result.matchedIndustry ? '일치' : '불일치'}
                          </span>
                        </div>

                        {/* 지역 일치 */}
                        <div className="flex items-center gap-1.5">
                          {result.matchedLocation ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400" />
                          )}
                          <span
                            className={
                              result.matchedLocation
                                ? 'text-green-700 font-medium'
                                : 'text-gray-500'
                            }
                          >
                            지역 {result.matchedLocation ? '일치' : '불일치'}
                          </span>
                        </div>

                        {/* 키워드 일치 */}
                        {result.matchedKeywords.length > 0 && (
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="text-green-700 font-medium">키워드:</span>
                              {result.matchedKeywords.map((keyword, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs px-1.5 py-0 h-5 bg-green-50 border-green-200 text-green-700"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
