/**
 * @file /app/programs/page.tsx
 * @description 정부지원사업 프로그램 목록 페이지
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProgramRoadmap } from '@/components/programs/ProgramRoadmap';
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

  // 뷰 타입 (card | table)
  type ViewType = 'card' | 'table';
  const [viewType, setViewType] = useState<ViewType>(() => {
    const view = searchParams.get('view');
    return view === 'table' ? 'table' : 'card';
  });

  // URL 쿼리 파라미터에서 초기 필터 상태 읽기
  const [filters, setFilters] = useState<FilterType>(() => {
    // keywords 파라미터 파싱 (콤마로 구분된 문자열)
    const keywordsParam = searchParams.get('keywords');
    const keywords = keywordsParam
      ? keywordsParam
          .split(',')
          .map(k => k.trim())
          .filter(Boolean)
      : undefined;

    return {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 50,
      dataSource: searchParams.get('dataSource') || undefined,
      keywords: keywords && keywords.length > 0 ? keywords : undefined,
      showActiveOnly: searchParams.get('showActiveOnly') !== 'false', // 기본값 true
      registeredFrom: searchParams.get('registeredFrom') || undefined,
      registeredTo: searchParams.get('registeredTo') || undefined,
    };
  });

  /**
   * URL 쿼리 파라미터 업데이트
   */
  const updateURLParams = (newFilters: FilterType, newViewType?: ViewType) => {
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
    // 다중 키워드를 콤마로 구분하여 URL에 저장
    if (newFilters.keywords && newFilters.keywords.length > 0) {
      params.set('keywords', newFilters.keywords.join(','));
    }
    // showActiveOnly는 기본값이 true이므로 false일 때만 URL에 추가
    if (newFilters.showActiveOnly === false) {
      params.set('showActiveOnly', 'false');
    }
    // 등록일 기간 필터
    if (newFilters.registeredFrom) {
      params.set('registeredFrom', newFilters.registeredFrom);
    }
    if (newFilters.registeredTo) {
      params.set('registeredTo', newFilters.registeredTo);
    }
    // 뷰 타입 (기본값 card이므로 table일 때만 저장)
    const currentView = newViewType ?? viewType;
    if (currentView === 'table') {
      params.set('view', 'table');
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
   * 뷰 타입 변경 핸들러
   */
  const handleViewTypeChange = (newViewType: ViewType) => {
    setViewType(newViewType);
    updateURLParams(filters, newViewType);
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

  /**
   * 페이지당 표시 개수 변경 핸들러
   */
  const handleLimitChange = (limit: number) => {
    // limit 변경 시 page를 1로 리셋
    const newFilters = { ...filters, limit, page: 1 };
    setFilters(newFilters);
    updateURLParams(newFilters);
  };

  // popstate 이벤트 리스닝 (브라우저 뒤로가기/앞으로가기)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);

      // keywords 파라미터 파싱 (콤마로 구분된 문자열)
      const keywordsParam = params.get('keywords');
      const keywords = keywordsParam
        ? keywordsParam
            .split(',')
            .map(k => k.trim())
            .filter(Boolean)
        : undefined;

      const newFilters: FilterType = {
        page: Number(params.get('page')) || 1,
        limit: Number(params.get('limit')) || 50,
        dataSource: params.get('dataSource') || undefined,
        keywords: keywords && keywords.length > 0 ? keywords : undefined,
        showActiveOnly: params.get('showActiveOnly') !== 'false', // 기본값 true
        registeredFrom: params.get('registeredFrom') || undefined,
        registeredTo: params.get('registeredTo') || undefined,
      };
      setFilters(newFilters);

      // viewType도 파싱
      const view = params.get('view');
      setViewType(view === 'table' ? 'table' : 'card');
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

        {/* 주요 지원사업 연간 일정 (로드맵) */}
        <ProgramRoadmap />

        {/* 필터 섹션 (모바일 최적화) */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <ProgramFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {/* 목록 섹션 */}
        <ProgramList
          filters={filters}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          viewType={viewType}
          onViewTypeChange={handleViewTypeChange}
        />
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
