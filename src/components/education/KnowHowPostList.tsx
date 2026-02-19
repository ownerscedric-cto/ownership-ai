'use client';

import Link from 'next/link';
import { type KnowHowPost } from './KnowHowPostCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Pin } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';

interface KnowHowPostListProps {
  posts: KnowHowPost[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  showCategoryColumn?: boolean; // 카테고리 열 표시 여부 (하위 카테고리에서는 false)
}

/**
 * 노하우 게시글 목록 컴포넌트 (테이블 형식)
 * - 전형적인 게시판 구조
 * - 번호, 카테고리, 제목, 작성자, 작성일, 조회수, 댓글수
 * - 고정글 우선 표시
 * - 페이지네이션
 */
export function KnowHowPostList({
  posts,
  total,
  page,
  limit,
  onPageChange,
  isLoading,
  showCategoryColumn = true,
}: KnowHowPostListProps) {
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded h-12 animate-pulse" />
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

  // 고정글을 상단에 배치
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  // 현재 페이지의 시작 번호 계산
  const startNumber = total - (page - 1) * limit;

  return (
    <div>
      {/* 게시글 테이블 */}
      <div className="border rounded-lg overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16 text-center">번호</TableHead>
              {showCategoryColumn && <TableHead className="w-28 text-center">카테고리</TableHead>}
              <TableHead>제목</TableHead>
              <TableHead className="w-28 text-center">작성자</TableHead>
              <TableHead className="w-32 text-center">작성일</TableHead>
              <TableHead className="w-20 text-center">조회</TableHead>
              <TableHead className="w-20 text-center">댓글</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPosts.map((post, index) => {
              const postNumber = post.isPinned ? '' : startNumber - index;

              return (
                <TableRow
                  key={post.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    post.isPinned ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {/* 번호 */}
                  <TableCell className="text-center text-sm text-gray-600">
                    {post.isPinned ? (
                      <Pin className="w-4 h-4 text-[#0052CC] mx-auto" fill="#0052CC" />
                    ) : (
                      <span>{postNumber}</span>
                    )}
                  </TableCell>

                  {/* 카테고리 */}
                  {showCategoryColumn && (
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1 items-center">
                        {post.isAnnouncement && (
                          <Badge variant="destructive" className="text-xs">
                            공지
                          </Badge>
                        )}
                        {post.isEvent && <Badge className="text-xs bg-green-600">이벤트</Badge>}
                        {!post.isAnnouncement && !post.isEvent && (
                          <Badge variant="secondary" className="text-xs">
                            {post.category.name}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {/* 제목 */}
                  <TableCell>
                    <Link
                      href={`/education/knowhow/posts/${post.id}`}
                      className="hover:text-[#0052CC] transition-colors font-medium text-gray-900 line-clamp-1 block"
                    >
                      {post.title}
                    </Link>
                  </TableCell>

                  {/* 작성자 */}
                  <TableCell className="text-center text-sm text-gray-600">
                    {post.authorName}
                  </TableCell>

                  {/* 작성일 */}
                  <TableCell className="text-center text-sm text-gray-500">
                    {formatRelativeTime(post.createdAt)}
                  </TableCell>

                  {/* 조회수 */}
                  <TableCell className="text-center text-sm text-gray-600">
                    {post.viewCount.toLocaleString()}
                  </TableCell>

                  {/* 댓글수 */}
                  <TableCell className="text-center text-sm">
                    {post._count.comments > 0 ? (
                      <span className="text-[#0052CC] font-medium">
                        {post._count.comments.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
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
