'use client';

/**
 * @file CustomerWatchlist.tsx
 * @description Display customer's watchlist programs
 */

import { Star, Trash2, ExternalLink, Tag, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeadlineBadge } from '@/components/programs/DeadlineBadge';
import { toast } from 'sonner';
import {
  useWatchlist,
  useRemoveFromWatchlist,
  type WatchlistProgram,
} from '@/lib/hooks/useWatchlist';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { truncateText, decodeHtmlEntities } from '@/lib/utils/html';

/**
 * 데이터 소스 이름 정규화 함수
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

interface CustomerWatchlistProps {
  customerId: string;
}

export function CustomerWatchlist({ customerId }: CustomerWatchlistProps) {
  const { data: watchlist, isLoading, error } = useWatchlist(customerId);
  const removeFromWatchlist = useRemoveFromWatchlist();

  const handleRemove = async (programId: string, programTitle: string) => {
    if (!confirm(`"${programTitle}"을 관심 목록에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await removeFromWatchlist.mutateAsync({
        customerId,
        programId,
      });

      toast.success('관심 목록에서 삭제했습니다', {
        description: `"${programTitle}"를 관심 목록에서 삭제했습니다.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '삭제에 실패했습니다';

      toast.error('삭제 실패', {
        description: errorMessage,
      });
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Star className="w-6 h-6 text-[#0052CC]" />
          <h2 className="text-2xl font-semibold text-gray-900">관심 목록</h2>
          <Skeleton className="h-6 w-12 ml-2" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-6 h-6 text-[#0052CC]" />
          <h2 className="text-2xl font-semibold text-gray-900">관심 목록</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">❌ 관심 목록을 불러올 수 없습니다</p>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
          </p>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (!watchlist || watchlist.items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-6 h-6 text-[#0052CC]" />
          <h2 className="text-2xl font-semibold text-gray-900">관심 목록</h2>
          <Badge variant="secondary" className="ml-2">
            0개
          </Badge>
        </div>
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium mb-2">아직 관심 프로그램이 없습니다</p>
          <p className="text-gray-500 text-sm mb-4">
            프로그램 상세 페이지에서 &apos;관심 목록에 추가&apos; 버튼을 눌러보세요
          </p>
          <Link href="/programs">
            <Button variant="default">
              <ExternalLink className="w-4 h-4 mr-2" />
              프로그램 둘러보기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-6">
        <Star className="w-6 h-6 text-[#0052CC]" />
        <h2 className="text-2xl font-semibold text-gray-900">관심 목록</h2>
        <Badge variant="secondary" className="ml-2">
          {watchlist.total}개
        </Badge>
      </div>

      {/* 프로그램 카드 그리드 (한 줄에 3개) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchlist.items.map(item => (
          <WatchlistProgramCard
            key={item.id}
            item={item}
            onRemove={handleRemove}
            isRemoving={removeFromWatchlist.isPending}
          />
        ))}
      </div>
    </div>
  );
}

interface WatchlistProgramCardProps {
  item: WatchlistProgram;
  onRemove: (programId: string, programTitle: string) => void;
  isRemoving: boolean;
}

function WatchlistProgramCard({ item, onRemove, isRemoving }: WatchlistProgramCardProps) {
  const { program, addedAt, notes } = item;

  // 설명 최대 길이 제한
  const truncatedDescription = program.description ? truncateText(program.description, 150) : null;

  // 대상 업종/지역 최대 3개만 표시
  const displayedAudiences = program.targetAudience.slice(0, 3);
  const remainingAudiencesCount = Math.max(0, program.targetAudience.length - 3);

  const displayedLocations = program.targetLocation.slice(0, 3);
  const remainingLocationsCount = Math.max(0, program.targetLocation.length - 3);

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:border-[#0052CC]/50">
      <CardHeader className="space-y-2">
        {/* 데이터 소스 Badge + 마감일 Badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge
            className={
              dataSourceColors[normalizeDataSource(program.dataSource)] ||
              'bg-gray-100 text-gray-800'
            }
          >
            {normalizeDataSource(program.dataSource)}
          </Badge>
          <DeadlineBadge deadline={program.deadline} />
        </div>

        {/* 제목 */}
        <Link href={`/programs/${program.id}`} className="block group">
          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-[#0052CC] transition-colors line-clamp-2">
            {decodeHtmlEntities(program.title)}
          </CardTitle>
        </Link>

        {/* 카테고리 */}
        {program.category && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Tag className="w-4 h-4" />
            <span>{program.category}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 설명 */}
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

        {/* 추가일 */}
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span>추가: {format(new Date(addedAt), 'yyyy.MM.dd', { locale: ko })}</span>
        </div>

        {/* 메모 */}
        {notes && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-amber-800">💡 메모:</span> {notes}
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-2">
          <Link href={`/programs/${program.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="w-4 h-4 mr-1" />
              상세 보기
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onRemove(program.id, program.title)}
            disabled={isRemoving}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            삭제
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
