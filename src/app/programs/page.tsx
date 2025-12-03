/**
 * @file /app/programs/page.tsx
 * @description 정부지원사업 프로그램 목록 페이지
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProgramFilters } from '@/components/programs/ProgramFilters';
import { ProgramList } from '@/components/programs/ProgramList';
import type { ProgramFilters as FilterType } from '@/lib/types/program';

/**
 * 정부지원사업 프로그램 목록 페이지
 *
 * 기능:
 * - 프로그램 필터 (데이터 소스, 키워드)
 * - 프로그램 목록 (그리드 뷰)
 * - 페이지네이션
 */
export default function ProgramsPage() {
  const [filters, setFilters] = useState<FilterType>({
    page: 1,
    limit: 20,
  });

  /**
   * 필터 변경 핸들러
   */
  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
  };

  /**
   * 페이지 변경 핸들러
   */
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    // 페이지 변경 시 스크롤을 상단으로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* 헤더 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">정부지원사업</h1>
          <p className="text-gray-600">
            다양한 정부지원사업 프로그램을 한눈에 확인하고 검색해보세요.
          </p>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ProgramFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {/* 목록 섹션 */}
        <ProgramList filters={filters} onPageChange={handlePageChange} />
      </div>
    </AppLayout>
  );
}
