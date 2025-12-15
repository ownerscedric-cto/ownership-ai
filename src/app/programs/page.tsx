/**
 * @file /app/programs/page.tsx
 * @description 정부지원사업 프로그램 목록 페이지
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProgramFilters } from '@/components/programs/ProgramFilters';
import { ProgramList } from '@/components/programs/ProgramList';
import type { ProgramFilters as FilterType } from '@/lib/types/program';

/**
 * 정부지원사업 프로그램 목록 페이지 내용
 *
 * 기능:
 * - 프로그램 필터 (데이터 소스, 키워드)
 * - 프로그램 목록 (그리드 뷰)
 * - 페이지네이션
 * - URL 쿼리 파라미터로 상태 관리 (뒤로가기/앞으로가기/새로고침 지원)
 */
function ProgramsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 쿼리 파라미터에서 초기 필터 상태 읽기
  const [filters, setFilters] = useState<FilterType>(() => ({
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 50,
    dataSource: searchParams.get('dataSource') || undefined,
    keyword: searchParams.get('keyword') || undefined,
    showActiveOnly: searchParams.get('showActiveOnly') !== 'false', // 기본값 true
  }));

  /**
   * URL 쿼리 파라미터 업데이트
   */
  const updateURLParams = (newFilters: FilterType) => {
    const params = new URLSearchParams();

    if (newFilters.page && newFilters.page > 1) {
      params.set('page', newFilters.page.toString());
    }
    if (newFilters.limit && newFilters.limit !== 50) {
      params.set('limit', newFilters.limit.toString());
    }
    if (newFilters.dataSource) {
      params.set('dataSource', newFilters.dataSource);
    }
    if (newFilters.keyword) {
      params.set('keyword', newFilters.keyword);
    }
    // showActiveOnly는 기본값이 true이므로 false일 때만 URL에 추가
    if (newFilters.showActiveOnly === false) {
      params.set('showActiveOnly', 'false');
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/programs?${queryString}` : '/programs';

    // URL이 현재 URL과 다를 때만 업데이트 (무한 루프 방지)
    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl !== newUrl) {
      // History API를 직접 사용하여 명시적으로 새 entry 추가
      window.history.pushState({}, '', newUrl);

      // Next.js 라우터에도 알림 (페이지 데이터 갱신)
      router.refresh();
    }
  };

  /**
   * 필터 변경 핸들러
   */
  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
    updateURLParams(newFilters);
  };

  /**
   * 페이지 변경 핸들러
   */
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    updateURLParams(newFilters);
    // 페이지 변경 시 스크롤을 상단으로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // URL 쿼리 파라미터에서 필터 상태 파싱 (useMemo로 최적화)
  const parsedFilters = useMemo<FilterType>(() => {
    return {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 50,
      dataSource: searchParams.get('dataSource') || undefined,
      keyword: searchParams.get('keyword') || undefined,
      showActiveOnly: searchParams.get('showActiveOnly') !== 'false', // 기본값 true
    };
  }, [searchParams]);

  // 파싱된 필터를 상태에 반영 (searchParams 변경 시)
  useEffect(() => {
    setFilters(parsedFilters);
  }, [parsedFilters]);

  // popstate 이벤트 리스닝 (브라우저 뒤로가기/앞으로가기)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const newFilters: FilterType = {
        page: Number(params.get('page')) || 1,
        limit: Number(params.get('limit')) || 50,
        dataSource: params.get('dataSource') || undefined,
        keyword: params.get('keyword') || undefined,
        showActiveOnly: params.get('showActiveOnly') !== 'false', // 기본값 true
      };
      setFilters(newFilters);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl space-y-6 sm:space-y-8">
        {/* 헤더 (모바일 최적화) */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">정부지원사업</h1>
          <p className="text-sm sm:text-base text-gray-600">
            다양한 정부지원사업 프로그램을 한눈에 확인하고 검색해보세요.
          </p>
        </div>

        {/* 필터 섹션 (모바일 최적화) */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <ProgramFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {/* 목록 섹션 */}
        <ProgramList filters={filters} onPageChange={handlePageChange} />
      </div>
    </AppLayout>
  );
}

/**
 * 정부지원사업 프로그램 목록 페이지
 * Suspense로 감싸서 useSearchParams() 사용 가능하게 함
 */
export default function ProgramsPage() {
  return (
    <Suspense
      fallback={<div className="h-screen flex items-center justify-center">로딩 중...</div>}
    >
      <ProgramsPageContent />
    </Suspense>
  );
}
