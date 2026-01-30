/**
 * @file ProgramList.tsx
 * @description 프로그램 목록 컴포넌트
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

'use client';

import React, { useState } from 'react';
import { ProgramCard } from './ProgramCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  AlertCircle,
  FileText,
  Copy,
  CheckCheck,
  LayoutGrid,
  List,
  Check,
  ExternalLink,
} from 'lucide-react';
import { DeadlineBadge } from './DeadlineBadge';
import { decodeHtmlEntities } from '@/lib/utils/html';
import Link from 'next/link';
import { formatDateShort } from '@/lib/utils/date';
import { formatProgramsToText } from '@/lib/utils/programTextFormatter';
import { toast } from 'sonner';

type ViewType = 'card' | 'table';

interface ProgramListProps {
  filters: ProgramFilters;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  viewType: ViewType;
  onViewTypeChange: (viewType: ViewType) => void;
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
const LIMIT_OPTIONS = [30, 50, 100] as const;

export function ProgramList({
  filters,
  onPageChange,
  onLimitChange,
  viewType,
  onViewTypeChange,
}: ProgramListProps) {
  const { data, isLoading, error } = useProgramsWithMetadata(filters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCopied, setIsCopied] = useState(false);

  // 현재 페이지의 모든 프로그램 ID 목록
  const currentPageProgramIds = data?.data?.map(p => p.id) ?? [];

  // 현재 페이지에서 선택된 프로그램 수
  const selectedCountInPage = currentPageProgramIds.filter(id => selectedIds.has(id)).length;

  // 전체 선택 여부
  const isAllSelected =
    currentPageProgramIds.length > 0 && selectedCountInPage === currentPageProgramIds.length;

  /**
   * 프로그램 선택/해제 토글
   */
  const handleToggleSelect = (programId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  /**
   * 현재 페이지 전체 선택/해제
   */
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // 전체 해제
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        currentPageProgramIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // 전체 선택
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        currentPageProgramIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  };

  /**
   * 특정 날짜의 프로그램 전체 선택/해제
   */
  const handleToggleSelectByDate = (programIds: string[]) => {
    const allSelected = programIds.every(id => selectedIds.has(id));
    if (allSelected) {
      // 해당 날짜 전체 해제
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        programIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // 해당 날짜 전체 선택
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        programIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  };

  /**
   * 선택 초기화
   */
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  /**
   * 선택된 프로그램 텍스트 복사
   */
  const handleCopySelected = async () => {
    if (!data?.data || selectedIds.size === 0) {
      toast.error('복사할 프로그램이 없습니다', {
        description: '프로그램을 선택해주세요.',
      });
      return;
    }

    // 선택된 프로그램만 필터링
    const selectedPrograms = data.data.filter(p => selectedIds.has(p.id));

    try {
      const text = formatProgramsToText(selectedPrograms, {
        includeHeader: true,
        includeFooter: true,
      });

      await navigator.clipboard.writeText(text);

      setIsCopied(true);
      toast.success('클립보드에 복사했습니다!', {
        description: `${selectedPrograms.length}개의 프로그램을 복사했습니다.`,
      });

      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      toast.error('복사에 실패했습니다', {
        description: '다시 시도해주세요.',
      });
    }
  };

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

      {/* 선택 컨트롤 바 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border">
        {/* 왼쪽: 선택 관련 컨트롤 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={handleToggleSelectAll}
              className="data-[state=checked]:bg-[#0052CC]"
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              {isAllSelected ? '전체 해제' : '전체 선택'}
            </label>
          </div>

          {selectedIds.size > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-[#0052CC]">{selectedIds.size}</span>개 선택됨
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-gray-500 hover:text-gray-700 h-8 px-2"
              >
                선택 해제
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleCopySelected}
                className="bg-[#0052CC] hover:bg-[#003d99] h-8 gap-1.5"
              >
                {isCopied ? (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    복사됨!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    텍스트 복사
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* 뷰 전환 + 개수 선택 (모바일: 양끝 배치, 데스크톱: 오른쪽 정렬) */}
        <div className="flex items-center justify-between sm:justify-end sm:gap-4">
          {/* 뷰 전환 버튼 */}
          <div className="flex items-center gap-1 bg-white rounded-md border p-1">
            <Button
              variant={viewType === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewTypeChange('card')}
              className={`h-8 px-3 gap-1.5 ${viewType === 'card' ? 'bg-[#0052CC] hover:bg-[#003d99]' : ''}`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">카드</span>
            </Button>
            <Button
              variant={viewType === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewTypeChange('table')}
              className={`h-8 px-3 gap-1.5 ${viewType === 'table' ? 'bg-[#0052CC] hover:bg-[#003d99]' : ''}`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">테이블</span>
            </Button>
          </div>

          {/* 페이지당 표시 개수 드롭다운 */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-600 hidden sm:inline">페이지당 표시 개수</span>
            <Select
              value={String(filters.limit || 50)}
              onValueChange={value => onLimitChange(Number(value))}
            >
              <SelectTrigger className="w-[90px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIMIT_OPTIONS.map(limit => (
                  <SelectItem key={limit} value={String(limit)}>
                    {limit}개
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 카드 뷰 - 날짜별 그룹핑 */}
      {viewType === 'card' && (
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
                  <ProgramCard
                    key={program.id}
                    program={program}
                    isSelected={selectedIds.has(program.id)}
                    onToggleSelect={() => handleToggleSelect(program.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 테이블 뷰 - 날짜별 그룹핑 */}
      {viewType === 'table' && (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: '40px' }} />
              <col style={{ width: '55%' }} />
              <col style={{ width: '80px' }} className="hidden md:table-column" />
              <col style={{ width: '90px' }} className="hidden lg:table-column" />
              <col style={{ width: '100px' }} />
              <col style={{ width: '50px' }} />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-2 py-3 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mx-auto ${
                      isAllSelected
                        ? 'bg-[#0052CC] border-[#0052CC] text-white'
                        : 'border-gray-300 hover:border-[#0052CC] bg-white'
                    }`}
                  >
                    {isAllSelected && <Check className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-2 py-3 text-center text-sm font-semibold text-gray-700">
                  프로그램명
                </th>
                <th className="px-2 py-3 text-center text-sm font-semibold text-gray-700 hidden md:table-cell">
                  출처
                </th>
                <th className="px-2 py-3 text-center text-sm font-semibold text-gray-700 hidden lg:table-cell">
                  카테고리
                </th>
                <th className="px-2 py-3 text-center text-sm font-semibold text-gray-700">
                  마감일
                </th>
                <th className="px-2 py-3 text-center text-sm font-semibold text-gray-700">링크</th>
              </tr>
            </thead>
            <tbody>
              {groupedPrograms.map(([date, datePrograms]) => {
                const dateProgramIds = datePrograms.map(p => p.id);
                const isDateAllSelected =
                  dateProgramIds.length > 0 && dateProgramIds.every(id => selectedIds.has(id));
                const isDatePartialSelected =
                  dateProgramIds.some(id => selectedIds.has(id)) && !isDateAllSelected;

                return (
                  <React.Fragment key={date}>
                    {/* 날짜 구분 행 */}
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectByDate(dateProgramIds)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mx-auto ${
                            isDateAllSelected
                              ? 'bg-[#0052CC] border-[#0052CC] text-white'
                              : isDatePartialSelected
                                ? 'bg-blue-200 border-[#0052CC]'
                                : 'border-gray-400 hover:border-[#0052CC] bg-white'
                          }`}
                          title={isDateAllSelected ? '전체 해제' : '전체 선택'}
                        >
                          {isDateAllSelected && <Check className="w-3 h-3" />}
                          {isDatePartialSelected && !isDateAllSelected && (
                            <div className="w-2 h-0.5 bg-[#0052CC]" />
                          )}
                        </button>
                      </td>
                      <td colSpan={5} className="px-3 py-2">
                        <span className="text-sm font-semibold text-gray-700">
                          {date}{' '}
                          <span className="text-gray-500 font-normal">
                            ({datePrograms.length}건)
                          </span>
                        </span>
                      </td>
                    </tr>
                    {/* 해당 날짜의 프로그램들 */}
                    {datePrograms.map(program => {
                      const isSelected = selectedIds.has(program.id);
                      return (
                        <tr
                          key={program.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelect(program.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mx-auto ${
                                isSelected
                                  ? 'bg-[#0052CC] border-[#0052CC] text-white'
                                  : 'border-gray-300 hover:border-[#0052CC] bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </button>
                          </td>
                          <td className="px-2 py-2 max-w-0">
                            <Link
                              href={`/programs/${program.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-[#0052CC] truncate block"
                              title={decodeHtmlEntities(program.title)}
                            >
                              {decodeHtmlEntities(program.title)}
                            </Link>
                          </td>
                          <td className="px-2 py-2 hidden md:table-cell text-center">
                            <Badge
                              className={`text-xs whitespace-nowrap ${
                                program.dataSource === '기업마당'
                                  ? 'bg-blue-100 text-blue-800'
                                  : program.dataSource === 'K-Startup'
                                    ? 'bg-green-100 text-green-800'
                                    : program.dataSource === 'KOCCA-PIMS' ||
                                        program.dataSource === 'KOCCA-Finance'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {program.dataSource === 'KOCCA-PIMS' ||
                              program.dataSource === 'KOCCA-Finance'
                                ? '콘진원'
                                : program.dataSource}
                            </Badge>
                          </td>
                          <td className="px-2 py-2 hidden lg:table-cell text-center">
                            <span className="text-xs text-gray-600 truncate block">
                              {program.category ? decodeHtmlEntities(program.category) : '-'}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex justify-center">
                              <DeadlineBadge
                                deadline={program.deadline}
                                rawData={program.rawData}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {program.sourceUrl && (
                              <a
                                href={program.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 text-gray-500 hover:text-[#0052CC] transition-colors"
                                title="원문 보기"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
