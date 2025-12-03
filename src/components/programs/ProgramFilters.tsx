/**
 * @file ProgramFilters.tsx
 * @description 프로그램 필터 컴포넌트
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ProgramFilters as FilterType } from '@/lib/types/program';

interface ProgramFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

/**
 * 데이터 소스 목록
 */
const dataSources = ['전체', '기업마당', 'K-Startup', '한국콘텐츠진흥원'] as const;

/**
 * 프로그램 필터 컴포넌트
 *
 * 기능:
 * - 데이터 소스 필터 (전체/기업마당/K-Startup/KOCCA-PIMS/KOCCA-Finance)
 * - 키워드 검색 (제목, 키워드 검색)
 * - 필터 초기화
 */
export function ProgramFilters({ filters, onFiltersChange }: ProgramFiltersProps) {
  const [keyword, setKeyword] = useState(filters.keyword || '');

  /**
   * 데이터 소스 필터 변경
   */
  const handleDataSourceChange = (value: string) => {
    onFiltersChange({
      ...filters,
      dataSource: value === '전체' ? undefined : value,
      page: 1, // 필터 변경 시 첫 페이지로 이동
    });
  };

  /**
   * 키워드 검색 실행
   */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({
      ...filters,
      keyword: keyword.trim() || undefined,
      page: 1, // 검색 시 첫 페이지로 이동
    });
  };

  /**
   * 키워드 초기화
   */
  const handleClearKeyword = () => {
    setKeyword('');
    onFiltersChange({
      ...filters,
      keyword: undefined,
      page: 1,
    });
  };

  /**
   * 전체 필터 초기화
   */
  const handleResetFilters = () => {
    setKeyword('');
    onFiltersChange({
      page: 1,
      limit: filters.limit, // limit은 유지
    });
  };

  // 활성 필터 개수 계산
  const activeFiltersCount = [filters.dataSource, filters.keyword].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* 데이터 소스 필터 (Tabs) */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          데이터 소스
        </h3>
        <Tabs
          value={filters.dataSource || '전체'}
          onValueChange={handleDataSourceChange}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-5 h-auto gap-1 bg-gray-100 p-1">
            {dataSources.map(source => (
              <TabsTrigger
                key={source}
                value={source}
                className="text-xs sm:text-sm py-2 data-[state=active]:bg-[#0052CC] data-[state=active]:text-white"
              >
                {source}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* 키워드 검색 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Search className="w-4 h-4" />
          키워드 검색
        </h3>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="제목, 키워드 검색..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="pl-10 pr-10"
            />
            {keyword && (
              <button
                type="button"
                onClick={handleClearKeyword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" className="bg-[#0052CC] hover:bg-[#003d99]">
            검색
          </Button>
        </form>
      </div>

      {/* 활성 필터 표시 및 초기화 */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">활성 필터:</span>
            {filters.dataSource && (
              <Badge variant="outline" className="text-sm">
                {filters.dataSource}
              </Badge>
            )}
            {filters.keyword && (
              <Badge variant="outline" className="text-sm">
                {filters.keyword}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            초기화
          </Button>
        </div>
      )}
    </div>
  );
}
