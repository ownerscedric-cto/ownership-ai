'use client';

/**
 * @file CustomerWatchlist.tsx
 * @description Display customer's watchlist programs
 */

import { Star, Trash2, ExternalLink, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useWatchlist,
  useRemoveFromWatchlist,
  type WatchlistProgram,
} from '@/lib/hooks/useWatchlist';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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
            프로그램 상세 페이지에서 &quot;관심 목록에 추가&quot; 버튼을 눌러보세요
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

      {/* 프로그램 카드 리스트 */}
      <div className="space-y-4">
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

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-[#0052CC] transition-all">
      <div className="flex items-start justify-between gap-4">
        {/* 프로그램 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {program.dataSource}
            </Badge>
            {program.category && (
              <Badge variant="secondary" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {program.category}
              </Badge>
            )}
          </div>

          <Link href={`/programs/${program.id}`} className="block group mb-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0052CC] transition-colors line-clamp-2">
              {program.title}
            </h3>
          </Link>

          {program.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{program.description}</p>
          )}

          {/* 메타 정보 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {program.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  마감:{' '}
                  {format(new Date(program.deadline), 'yyyy.MM.dd', {
                    locale: ko,
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>
                추가:{' '}
                {format(new Date(addedAt), 'yyyy.MM.dd', {
                  locale: ko,
                })}
              </span>
            </div>
          </div>

          {/* 메모 */}
          {notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <span className="font-medium">메모:</span> {notes}
              </p>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-2">
          <Link href={`/programs/${program.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="w-4 h-4 mr-1" />
              상세
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onRemove(program.id, program.title)}
            disabled={isRemoving}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            삭제
          </Button>
        </div>
      </div>
    </div>
  );
}
