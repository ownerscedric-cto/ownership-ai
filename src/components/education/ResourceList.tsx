'use client';

import Link from 'next/link';
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
import { ChevronLeft, ChevronRight, Download, Video, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import type { Resource } from '@/hooks/useEducation';

interface ResourceListProps {
  resources: Resource[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onDownload: (resource: Resource) => void;
  isLoading?: boolean;
}

/**
 * 자료실 목록 컴포넌트 (테이블 형식)
 * - 노하우 커뮤니티와 동일한 게시판 구조
 * - 번호, 카테고리, 제목, 파일크기, 등록일, 다운로드수, 액션
 * - 페이지네이션
 */
export function ResourceList({
  resources,
  total,
  page,
  limit,
  onPageChange,
  onDownload,
  isLoading,
}: ResourceListProps) {
  const totalPages = Math.ceil(total / limit);

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded h-12 animate-pulse" />
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">등록된 자료가 없습니다</p>
        <p className="text-gray-400 text-sm">검색 조건을 변경해보세요</p>
      </div>
    );
  }

  // 현재 페이지의 시작 번호 계산
  const startNumber = total - (page - 1) * limit;

  return (
    <div>
      {/* 자료 테이블 */}
      <div className="border rounded-lg overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16 text-center">번호</TableHead>
              <TableHead className="w-28 text-center">카테고리</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="w-24 text-center">파일크기</TableHead>
              <TableHead className="w-32 text-center">등록일</TableHead>
              <TableHead className="w-24 text-center">다운로드</TableHead>
              <TableHead className="w-36 text-center">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource, index) => {
              const resourceNumber = startNumber - index;

              return (
                <TableRow key={resource.id} className="hover:bg-gray-50 transition-colors">
                  {/* 번호 */}
                  <TableCell className="text-center text-sm text-gray-600">
                    {resourceNumber}
                  </TableCell>

                  {/* 카테고리 */}
                  <TableCell className="text-center">
                    {resource.category ? (
                      <Badge variant="secondary" className="text-xs">
                        {resource.category.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">미분류</span>
                    )}
                  </TableCell>

                  {/* 제목 */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900 line-clamp-1">
                        {resource.title}
                      </span>
                      {resource.description && (
                        <span className="text-xs text-gray-500 line-clamp-1">
                          {resource.description}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* 파일크기 */}
                  <TableCell className="text-center text-sm text-gray-600">
                    {formatFileSize(resource.fileSize)}
                  </TableCell>

                  {/* 등록일 (KST) */}
                  <TableCell className="text-center text-sm text-gray-500">
                    {formatDate(resource.createdAt)}
                  </TableCell>

                  {/* 다운로드수 */}
                  <TableCell className="text-center text-sm text-gray-600">
                    {resource.downloadCount.toLocaleString()}회
                  </TableCell>

                  {/* 액션 버튼 */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* 다운로드 버튼 */}
                      <Button
                        onClick={() => onDownload(resource)}
                        size="sm"
                        className="bg-[#0052CC] hover:bg-[#0052CC]/90"
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      {/* 연결된 영상 버튼 */}
                      {resource.videoId && (
                        <Link href={`/education/videos/${resource.videoId}`}>
                          <Button size="sm" variant="outline" title="연결된 영상 보기">
                            <Video className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
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

      {/* 총 자료 수 */}
      <p className="text-center text-sm text-gray-500 mt-4">총 {total.toLocaleString()}개의 자료</p>
    </div>
  );
}
