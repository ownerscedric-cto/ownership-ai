/**
 * @file ProgramFilters.tsx
 * @description 프로그램 필터 컴포넌트 (모바일 최적화)
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ProgramFilters as FilterType } from '@/lib/types/program';
import { cn } from '@/lib/utils';

interface ProgramFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

/**
 * 데이터 소스 목록 (확장 가능)
 */
const dataSources = ['전체', '기업마당', 'K-Startup', '한국콘텐츠진흥원'] as const;

/**
 * 페이지당 개수 옵션
 */
const limitOptions = [30, 50, 100] as const;

/**
 * 프로그램 필터 컴포넌트
 *
 * 기능:
 * - 데이터 소스 필터 (전체/기업마당/K-Startup/KOCCA-PIMS/KOCCA-Finance)
 * - 키워드 검색 (제목, 키워드 검색)
 * - 필터 초기화
 */
export function ProgramFilters({ filters, onFiltersChange }: ProgramFiltersProps) {
  // 현재 입력중인 키워드 (아직 추가되지 않은 상태)
  const [inputKeyword, setInputKeyword] = useState('');

  // 다중 키워드 배열
  const keywords = filters.keywords || [];

  /**
   * filters.keywords가 변경되면 입력 필드 초기화
   * (브라우저 뒤로가기/앞으로가기 시)
   */
  useEffect(() => {
    // 외부에서 필터가 초기화된 경우 입력 필드도 초기화
    if (!filters.keywords || filters.keywords.length === 0) {
      setInputKeyword('');
    }
  }, [filters.keywords]);

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
   * 페이지당 개수 변경
   */
  const handleLimitChange = (value: number) => {
    onFiltersChange({
      ...filters,
      limit: value,
      page: 1, // 페이지당 개수 변경 시 첫 페이지로 이동
    });
  };

  /**
   * 키워드 추가 (검색 버튼 클릭 또는 Enter)
   */
  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKeyword.trim();
    if (!trimmed) return;

    // 이미 존재하는 키워드면 추가하지 않음
    if (keywords.includes(trimmed)) {
      setInputKeyword('');
      return;
    }

    onFiltersChange({
      ...filters,
      keywords: [...keywords, trimmed],
      page: 1, // 검색 시 첫 페이지로 이동
    });
    setInputKeyword(''); // 입력 필드 초기화
  };

  /**
   * 특정 키워드 삭제
   */
  const handleRemoveKeyword = (keywordToRemove: string) => {
    const newKeywords = keywords.filter(k => k !== keywordToRemove);
    onFiltersChange({
      ...filters,
      keywords: newKeywords.length > 0 ? newKeywords : undefined,
      page: 1,
    });
  };

  /**
   * 입력 필드 초기화 (X 버튼)
   */
  const handleClearInput = () => {
    setInputKeyword('');
  };

  /**
   * 진행중인 공고만 보기 필터 변경
   */
  const handleShowActiveOnlyChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      showActiveOnly: checked,
      page: 1, // 필터 변경 시 첫 페이지로 이동
    });
  };

  /**
   * 날짜를 로컬 타임존 기준 YYYY-MM-DD 문자열로 변환
   * (toISOString()은 UTC 기준이라 하루 밀릴 수 있음)
   */
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * 등록일 시작 필터 변경
   */
  const handleRegisteredFromChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      registeredFrom: date ? formatLocalDate(date) : undefined,
      page: 1,
    });
  };

  /**
   * 등록일 종료 필터 변경
   */
  const handleRegisteredToChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      registeredTo: date ? formatLocalDate(date) : undefined,
      page: 1,
    });
  };

  /**
   * 전체 필터 초기화
   */
  const handleResetFilters = () => {
    setInputKeyword('');
    onFiltersChange({
      page: 1,
      limit: filters.limit, // limit은 유지
      showActiveOnly: true, // 진행중인 공고만 보기 기본값 유지
    });
  };

  // 활성 필터 개수 계산 (showActiveOnly는 기본값이 true이므로 false일 때만 활성 필터로 표시)
  const activeFiltersCount = [
    filters.dataSource,
    keywords.length > 0 ? 'keywords' : null,
    filters.showActiveOnly === false ? 'inactive' : null,
    filters.registeredFrom ? 'registeredFrom' : null,
    filters.registeredTo ? 'registeredTo' : null,
  ].filter(Boolean).length;

  // 등록일 필터 Date 객체 변환 (로컬 타임존 기준으로 파싱)
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const registeredFromDate = filters.registeredFrom
    ? parseLocalDate(filters.registeredFrom)
    : undefined;
  const registeredToDate = filters.registeredTo ? parseLocalDate(filters.registeredTo) : undefined;

  return (
    <div className="space-y-4">
      {/* 데이터 소스 필터 (반응형 그리드, 확장 가능) */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          데이터 소스
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {dataSources.map(source => (
            <button
              key={source}
              type="button"
              onClick={() => handleDataSourceChange(source)}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                'border border-gray-200 hover:border-[#0052CC]',
                'focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:ring-offset-1',
                filters.dataSource === source || (!filters.dataSource && source === '전체')
                  ? 'bg-[#0052CC] text-white border-[#0052CC]'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      {/* 페이지당 개수 선택 + 키워드 검색 + 진행중인 공고만 보기 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Search className="w-4 h-4" />
          검색 및 필터
        </h3>
        <form onSubmit={handleAddKeyword} className="flex flex-wrap gap-2 items-center">
          {/* 페이지당 개수 Select */}
          <Select
            value={(filters.limit || 50).toString()}
            onValueChange={value => handleLimitChange(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map(limit => (
                <SelectItem key={limit} value={limit.toString()}>
                  {limit}개
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 키워드 검색 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="키워드 입력 후 검색 (여러 개 추가 가능)..."
              value={inputKeyword}
              onChange={e => setInputKeyword(e.target.value)}
              className="pl-10 pr-10"
            />
            {inputKeyword && (
              <button
                type="button"
                onClick={handleClearInput}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 검색 버튼 */}
          <Button
            type="submit"
            className="bg-[#0052CC] hover:bg-[#003d99] px-3 sm:px-4"
            aria-label="키워드 추가"
          >
            <Search className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">추가</span>
          </Button>
        </form>

        {/* 적용된 키워드 태그 목록 */}
        {keywords.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <span className="text-sm text-gray-500">검색 키워드:</span>
            {keywords.map(kw => (
              <Badge key={kw} variant="secondary" className="text-sm flex items-center gap-1 pr-1">
                {kw}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                  aria-label={`${kw} 삭제`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* 진행중인 공고만 보기 체크박스 - 검색창 아래 별도 영역 */}
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="show-active-only"
            checked={filters.showActiveOnly !== false}
            onCheckedChange={handleShowActiveOnlyChange}
          />
          <Label
            htmlFor="show-active-only"
            className="text-sm font-medium text-gray-700 cursor-pointer whitespace-nowrap"
          >
            진행중인 공고만 보기
          </Label>
        </div>
      </div>

      {/* 등록일 기간 필터 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          등록일 기간
        </h3>
        <div className="flex flex-wrap gap-2 items-center">
          {/* 시작일 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[150px] justify-start text-left font-normal',
                  !registeredFromDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {registeredFromDate
                  ? format(registeredFromDate, 'yyyy-MM-dd', { locale: ko })
                  : '시작일'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                locale={ko}
                selected={registeredFromDate}
                onSelect={handleRegisteredFromChange}
                disabled={date => (registeredToDate ? date > registeredToDate : false)}
              />
            </PopoverContent>
          </Popover>

          <span className="text-gray-500">~</span>

          {/* 종료일 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[150px] justify-start text-left font-normal',
                  !registeredToDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {registeredToDate
                  ? format(registeredToDate, 'yyyy-MM-dd', { locale: ko })
                  : '종료일'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                locale={ko}
                selected={registeredToDate}
                onSelect={handleRegisteredToChange}
                disabled={date => (registeredFromDate ? date < registeredFromDate : false)}
              />
            </PopoverContent>
          </Popover>

          {/* 기간 초기화 버튼 */}
          {(filters.registeredFrom || filters.registeredTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onFiltersChange({
                  ...filters,
                  registeredFrom: undefined,
                  registeredTo: undefined,
                  page: 1,
                });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              기간 초기화
            </Button>
          )}
        </div>
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
            {keywords.length > 0 && (
              <Badge variant="outline" className="text-sm">
                키워드 {keywords.length}개
              </Badge>
            )}
            {(filters.registeredFrom || filters.registeredTo) && (
              <Badge variant="outline" className="text-sm">
                등록일: {filters.registeredFrom || '~'} ~ {filters.registeredTo || '~'}
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
