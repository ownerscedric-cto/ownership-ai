'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KnowHowCard } from '@/components/education/KnowHowCard';
import { useKnowHowPosts, useKnowHowCategories } from '@/hooks/useEducation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

/**
 * 노하우 아카이브 목록 페이지
 * - 카테고리 필터링
 * - 검색 기능
 * - Grid 레이아웃 (3열)
 */
export default function KnowHowPage() {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // 카테고리 목록 조회
  const { data: categoriesData } = useKnowHowCategories();
  const categories = categoriesData?.data || [];

  // React Query 데이터 조회
  const { data, isLoading, error } = useKnowHowPosts({
    categoryId: selectedCategoryId,
    search,
    limit: 12,
  });

  // 검색 실행
  const handleSearch = () => {
    setSearch(searchInput);
  };

  // 엔터 키 검색
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 뒤로가기 버튼 */}
        <Button onClick={() => router.push('/education')} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          교육 센터로
        </Button>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">노하우 커뮤니티</h1>
          <p className="text-gray-600">업종별/사업별 실전 노하우를 공유하고 확인하세요</p>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-8 space-y-4">
          {/* 검색창 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="노하우 검색..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-[#0052CC] hover:bg-[#0052CC]/90">
              검색
            </Button>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategoryId === undefined ? 'default' : 'outline'}
              className={`cursor-pointer ${selectedCategoryId === undefined ? 'bg-[#0052CC]' : ''}`}
              onClick={() => setSelectedCategoryId(undefined)}
            >
              전체
            </Badge>
            {categories.map(category => (
              <Badge
                key={category.id}
                variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                className={`cursor-pointer ${selectedCategoryId === category.id ? 'bg-[#0052CC]' : ''}`}
                onClick={() => setSelectedCategoryId(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* 결과 요약 */}
        {data && (
          <div className="mb-4 text-sm text-gray-600">총 {data.metadata.total}개의 노하우</div>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-lg p-6 space-y-4">
                <div className="h-4 bg-gray-300 rounded w-1/3" />
                <div className="h-6 bg-gray-300 rounded w-full" />
                <div className="h-4 bg-gray-300 rounded w-full" />
                <div className="h-4 bg-gray-300 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-red-600 font-semibold mb-2">
              노하우를 불러오는 중 오류가 발생했습니다
            </p>
            <p className="text-gray-600 text-sm">{error.message}</p>
          </div>
        )}

        {/* 데이터 없음 */}
        {!isLoading && !error && (!data?.data || data.data.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-600">등록된 노하우가 없습니다</p>
          </div>
        )}

        {/* 노하우 목록 */}
        {!isLoading && !error && data?.data && data.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map(knowhow => (
              <KnowHowCard key={knowhow.id} knowhow={knowhow} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
