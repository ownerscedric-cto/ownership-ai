/**
 * @file ProgramList.tsx
 * @description 프로그램 목록 컴포넌트
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

'use client';

import { ProgramCard } from './ProgramCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useProgramsWithMetadata } from '@/lib/hooks/usePrograms';
import type { ProgramFilters, Program } from '@/lib/types/program';
import { AlertCircle, FileText } from 'lucide-react';
import { formatDateShort } from '@/lib/utils/date';

interface ProgramListProps {
  filters: ProgramFilters;
  onPageChange: (page: number) => void;
}

/**
 * 프로그램 목록 컴포넌트
 *
 * 기능:
 * - 프로그램 카드 그리드 (1/2/3 컬럼 반응형)
 * - Skeleton 로딩 상태
 * - 에러 상태 표시
 * - 빈 상태 표시
 * - 페이지네이션
 * - 출처별 분포 통계
 */
export function ProgramList({ filters, onPageChange }: ProgramListProps) {
  const { data, isLoading, error } = useProgramsWithMetadata(filters);

  /**
   * 등록일 기준으로 프로그램 그룹핑
   */
  const groupProgramsByDate = (programs: Program[]) => {
    const groups: Record<string, Program[]> = {};

    programs.forEach(program => {
      const dateKey = formatDateShort(program.registeredAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(program);
    });

    // 날짜별로 정렬 (최신순)
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  /**
   * 로딩 상태 - Skeleton UI
   */
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /**
   * 에러 상태
   */
  if (error) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <div className="ml-2">
          <h4 className="font-semibold">데이터 로딩 실패</h4>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </Alert>
    );
  }

  /**
   * 빈 상태
   */
  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
        <p className="text-sm text-gray-500">다른 필터나 키워드로 검색해보세요.</p>
      </div>
    );
  }

  const { data: programs, metadata } = data;

  // 페이지네이션은 서버에서 처리 (showActiveOnly 필터 포함)
  const totalPages = Math.ceil(metadata.total / metadata.limit);
  const currentPage = metadata.page;

  // 프로그램을 날짜별로 그룹핑
  const groupedPrograms = groupProgramsByDate(programs);

  /**
   * 페이지네이션 범위 계산 (현재 페이지 기준 ±2)
   */
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5; // 최대 5개 페이지 번호 표시

    if (totalPages <= maxVisible) {
      // 총 페이지가 5개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 1페이지는 항상 표시
      pages.push(1);

      // 현재 페이지 기준 ±2 범위 계산
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      // 시작 ellipsis
      if (start > 2) {
        pages.push('ellipsis');
      }

      // 중간 페이지들
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // 끝 ellipsis
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }

      // 마지막 페이지는 항상 표시
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="space-y-6">
      {/* 결과 개수 및 출처 분포 */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">
          총 <span className="text-gray-900">{metadata.total.toLocaleString()}</span>개의 프로그램
          {filters.showActiveOnly !== false && <span className="text-gray-500 ml-1">(진행중)</span>}
        </span>
        {Object.keys(metadata.sourceDistribution).length > 0 && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">
              {Object.entries(metadata.sourceDistribution)
                .map(([source, count]) => `${source} ${count}개`)
                .join(', ')}
            </span>
          </>
        )}
      </div>

      {/* 프로그램 카드 - 날짜별 그룹핑 */}
      <div className="space-y-8">
        {groupedPrograms.map(([date, datePrograms]) => (
          <div key={date}>
            {/* 날짜 구분선 */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 border-t-2 border-gray-300"></div>
              <span className="text-lg font-semibold text-gray-700">{date}</span>
              <div className="flex-1 border-t-2 border-gray-300"></div>
            </div>

            {/* 해당 날짜의 프로그램 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {datePrograms.map(program => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {/* Previous */}
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {/* Page Numbers */}
            {pageNumbers.map((pageNumber, index) =>
              pageNumber === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNumber)}
                    isActive={currentPage === pageNumber}
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            {/* Next */}
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={
                  currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
