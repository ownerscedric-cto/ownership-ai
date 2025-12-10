'use client';

import { KnowHowPostCard, type KnowHowPost } from './KnowHowPostCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface KnowHowPostListProps {
  posts: KnowHowPost[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * 노하우 게시글 목록 컴포넌트
 * - 게시글 카드 목록
 * - 페이지네이션
 */
export function KnowHowPostList({
  posts,
  total,
  page,
  limit,
  onPageChange,
  isLoading,
}: KnowHowPostListProps) {
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-2">게시글이 없습니다</p>
        <p className="text-gray-400 text-sm">첫 번째 글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div>
      {/* 게시글 목록 */}
      <div className="space-y-3 mb-8">
        {posts.map((post) => (
          <KnowHowPostCard key={post.id} post={post} />
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              // 현재 페이지 주변 5개만 표시
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= page - 2 && pageNum <= page + 2)
              ) {
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="min-w-[2.5rem]"
                  >
                    {pageNum}
                  </Button>
                );
              } else if (pageNum === page - 3 || pageNum === page + 3) {
                return (
                  <span key={pageNum} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 총 게시글 수 */}
      <p className="text-center text-sm text-gray-500 mt-4">
        총 {total.toLocaleString()}개의 게시글
      </p>
    </div>
  );
}
