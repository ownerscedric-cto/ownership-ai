'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoList } from '@/components/education/VideoList';
import { useEducationVideos } from '@/hooks/useEducation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

/**
 * 교육 비디오 목록 페이지
 * - 카테고리 필터링
 * - 검색 기능
 * - 페이지네이션
 */
export default function VideosPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // React Query 데이터 조회
  const { data, isLoading, error } = useEducationVideos({
    category: selectedCategory,
    search,
    limit: 12,
  });

  // 카테고리 목록
  const categories = ['개요', '분야별', '신청서작성', '성공사례'];

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">교육 비디오</h1>
          <p className="text-gray-600">정부지원사업 관련 동영상 강의를 시청하세요</p>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-8 space-y-4">
          {/* 검색창 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="비디오 검색..."
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
              variant={selectedCategory === undefined ? 'default' : 'outline'}
              className={`cursor-pointer ${selectedCategory === undefined ? 'bg-[#0052CC]' : ''}`}
              onClick={() => setSelectedCategory(undefined)}
            >
              전체
            </Badge>
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className={`cursor-pointer ${selectedCategory === category ? 'bg-[#0052CC]' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* 결과 요약 */}
        {data && (
          <div className="mb-4 text-sm text-gray-600">총 {data.metadata.total}개의 비디오</div>
        )}

        {/* 비디오 목록 */}
        <VideoList videos={data?.data || []} isLoading={isLoading} error={error} />
      </div>
    </AppLayout>
  );
}
