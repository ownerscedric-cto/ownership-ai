/**
 * @file MatchingResults.tsx
 * @description Matching results list component with compact grid layout
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템 UI
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Building2, Tag, CheckCircle2, XCircle, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMatchingResults } from '@/lib/hooks/useMatching';
import { useAddToWatchlist, useWatchlist, useRemoveFromWatchlist } from '@/lib/hooks/useWatchlist';
import { MatchingFilters } from './MatchingFilters';
import { DeadlineBadge } from '../programs/DeadlineBadge';
import { cn } from '@/lib/utils';
import { truncateText, decodeHtmlEntities } from '@/lib/utils/html';
import { toast } from 'sonner';

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
 * MatchingResults Component - Compact Grid Layout
 *
 * @example
 * <MatchingResults customerId="customer-id-123" />
 */
export function MatchingResults({ customerId, className }: MatchingResultsProps) {
  const router = useRouter();
  const [minScore, setMinScore] = useState(30);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
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

  // 관심목록 토글 핸들러
  const handleToggleWatchlist = async (e: React.MouseEvent, programId: string) => {
    e.stopPropagation(); // Card 클릭 이벤트 전파 방지

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

  // Loading State - Grid Skeleton
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
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

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResults.map(result => {
          // 설명 최대 150자 제한
          const truncatedDescription = result.program.description
            ? truncateText(result.program.description, 150)
            : null;

          // 대상 업종/지역 최대 3개만 표시
          const displayedAudiences = result.program.targetAudience?.slice(0, 3) || [];
          const remainingAudiencesCount = Math.max(
            0,
            (result.program.targetAudience?.length || 0) - 3
          );

          const displayedLocations = result.program.targetLocation?.slice(0, 3) || [];
          const remainingLocationsCount = Math.max(
            0,
            (result.program.targetLocation?.length || 0) - 3
          );

          return (
            <Card
              key={result.id}
              onClick={() => router.push(`/programs/${result.program.id}`)}
              className="h-full transition-all duration-200 hover:shadow-md hover:border-[#0052CC]/50 cursor-pointer"
            >
              <CardHeader className="space-y-2">
                {/* 데이터 소스 Badge + 매칭 점수 Badge + 마감일 Badge + 별표 버튼 */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        dataSourceColors[normalizeDataSource(result.program.dataSource)] ||
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {normalizeDataSource(result.program.dataSource)}
                    </Badge>
                    <Badge className={getScoreBadgeColor(result.score)}>
                      {Math.round(result.score)}점
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <DeadlineBadge
                      deadline={result.program.deadline}
                      rawData={result.program.rawData}
                    />
                    {/* 관심목록 토글 버튼 */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => handleToggleWatchlist(e, result.program.id)}
                      className={cn(
                        'h-8 w-8 p-0 transition-colors',
                        watchlistProgramIds.has(result.program.id)
                          ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50'
                          : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                      )}
                      title={
                        watchlistProgramIds.has(result.program.id)
                          ? '관심 목록에서 제거'
                          : '관심 목록에 추가'
                      }
                      disabled={addToWatchlist.isPending || removeFromWatchlist.isPending}
                    >
                      <Star
                        className={cn(
                          'w-4 h-4',
                          watchlistProgramIds.has(result.program.id) && 'fill-current'
                        )}
                      />
                    </Button>
                  </div>
                </div>

                {/* 제목 */}
                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {decodeHtmlEntities(result.program.title)}
                </CardTitle>

                {/* 카테고리 */}
                {result.program.category && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Tag className="w-4 h-4" />
                    <span>{result.program.category}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {/* 매칭 상세 정보 */}
                <div className="flex flex-col gap-1 text-xs border-l-2 border-[#0052CC] pl-3 py-1 bg-blue-50/50">
                  {/* 업종 일치 */}
                  <div className="flex items-center gap-1.5">
                    {result.matchedIndustry ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <span
                      className={
                        result.matchedIndustry ? 'text-green-700 font-medium' : 'text-gray-500'
                      }
                    >
                      업종 {result.matchedIndustry ? '일치' : '불일치'}
                    </span>
                  </div>

                  {/* 지역 일치 */}
                  <div className="flex items-center gap-1.5">
                    {result.matchedLocation ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <span
                      className={
                        result.matchedLocation ? 'text-green-700 font-medium' : 'text-gray-500'
                      }
                    >
                      지역 {result.matchedLocation ? '일치' : '불일치'}
                    </span>
                  </div>

                  {/* 키워드 일치 */}
                  {result.matchedKeywords.length > 0 && (
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-green-700 font-medium">키워드:</span>
                        {result.matchedKeywords.slice(0, 3).map((keyword, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 bg-green-50 border-green-200 text-green-700"
                          >
                            {keyword}
                          </Badge>
                        ))}
                        {result.matchedKeywords.length > 3 && (
                          <span className="text-green-600 text-[10px]">
                            +{result.matchedKeywords.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 설명 (최대 150자) */}
                {truncatedDescription && (
                  <CardDescription className="text-sm text-gray-600 line-clamp-2">
                    {truncatedDescription}
                  </CardDescription>
                )}

                {/* 대상 업종 */}
                {displayedAudiences.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {displayedAudiences.map((audience, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {decodeHtmlEntities(audience)}
                        </Badge>
                      ))}
                      {remainingAudiencesCount > 0 && (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          +{remainingAudiencesCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* 대상 지역 */}
                {displayedLocations.length > 0 && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {displayedLocations.map((location, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {decodeHtmlEntities(location)}
                        </Badge>
                      ))}
                      {remainingLocationsCount > 0 && (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          +{remainingLocationsCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
