'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, ArrowLeft, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useKnowHowPosts, useKnowHowCategories } from '@/hooks/useEducation';
import { KnowHowPostList } from '@/components/education/KnowHowPostList';
import { KnowHowCategorySidebar } from '@/components/education/KnowHowCategorySidebar';
import { EducationGuard } from '@/components/education/EducationGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';

/**
 * 노하우 커뮤니티 메인 페이지 (네이버 카페 스타일)
 * - 좌측: 카테고리 사이드바 (계층형)
 * - 우측: 게시글 목록
 * - 프리미엄 이상 등급만 접근 가능
 */
export default function KnowHowCommunityPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'announcement' | 'event'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const limit = 20;

  // 카테고리 목록 조회 (하위 카테고리 여부 판단용)
  const { data: categoriesData } = useKnowHowCategories();

  // 게시글 조회 (탭에 따라 필터링)
  const { data: postsData, isLoading } = useKnowHowPosts({
    search: searchQuery,
    categoryId: selectedCategoryId,
    isAnnouncement: selectedTab === 'announcement' ? true : undefined,
    isEvent: selectedTab === 'event' ? true : undefined,
    page,
    limit,
  });

  // 선택된 카테고리가 하위 카테고리인지 확인 (parentId가 있으면 하위 카테고리)
  const isChildCategory = (() => {
    if (!selectedCategoryId || !categoriesData?.data) return false;
    const findCategory = (
      categories: Array<{
        id: string;
        parentId: string | null;
        children?: Array<{ id: string; parentId: string | null }>;
      }>
    ): boolean => {
      for (const cat of categories) {
        if (cat.id === selectedCategoryId) {
          return cat.parentId !== null;
        }
        if (cat.children) {
          const found = findCategory(cat.children);
          if (found) return true;
        }
      }
      return false;
    };
    return findCategory(categoriesData.data);
  })();

  // 카테고리 열 표시 여부: 전체글/공지/이벤트/상위카테고리에서만 표시, 하위 카테고리에서는 숨김
  const showCategoryColumn = !isChildCategory;

  // 검색 실행
  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  // 엔터 키 검색
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 카테고리 필터 변경
  const handleCategoryChange = (categoryId: string | undefined) => {
    setSelectedCategoryId(categoryId);
    setPage(1);
    setIsSidebarOpen(false); // 모바일에서 선택 후 사이드바 닫기
  };

  // 탭 변경
  const handleTabChange = (tab: 'all' | 'announcement' | 'event') => {
    setSelectedTab(tab);
    setPage(1);
  };

  // 현재 탭 제목
  const getTabTitle = () => {
    switch (selectedTab) {
      case 'announcement':
        return '공지사항';
      case 'event':
        return '이벤트';
      default:
        return selectedCategoryId ? '카테고리 게시글' : '전체글보기';
    }
  };

  return (
    <AppLayout>
      <EducationGuard>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* 뒤로가기 버튼 */}
          <Button onClick={() => router.push('/education')} variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            교육 센터로
          </Button>

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">노하우 커뮤니티</h1>
              <p className="text-sm text-gray-600 mt-1">
                컨설턴트들의 실전 노하우를 공유하고 소통하세요
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button
                onClick={() => router.push('/education/knowhow/archive')}
                variant="outline"
                size="default"
              >
                큐레이션 노하우
              </Button>
              <Button onClick={() => router.push('/education/knowhow/posts/new')} size="default">
                <PlusCircle className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">글쓰기</span>
              </Button>
            </div>
          </div>

          {/* 메인 레이아웃 (사이드바 + 콘텐츠) */}
          <div className="flex gap-6">
            {/* 모바일 사이드바 토글 버튼 */}
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden fixed bottom-4 left-4 z-50 shadow-lg bg-white"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* 모바일 오버레이 */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* 사이드바 */}
            <div
              className={cn(
                'fixed lg:relative inset-y-0 left-0 z-50 lg:z-0 transform transition-transform duration-300 ease-in-out lg:transform-none',
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
              )}
            >
              <div className="h-full lg:h-auto overflow-y-auto pt-16 lg:pt-0">
                <KnowHowCategorySidebar
                  selectedCategoryId={selectedCategoryId}
                  onCategoryChange={handleCategoryChange}
                  selectedTab={selectedTab}
                  onTabChange={handleTabChange}
                />
              </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="flex-1 min-w-0">
              {/* 검색창 */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="제목, 내용 검색..."
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
              </div>

              {/* 게시글 목록 */}
              <div className="bg-white rounded-lg shadow-sm">
                {/* 목록 헤더 */}
                <div className="px-4 py-3 border-b">
                  <h2 className="font-semibold text-gray-900">{getTabTitle()}</h2>
                </div>

                {/* 게시글 목록 */}
                <div className="p-4">
                  <KnowHowPostList
                    posts={postsData?.data || []}
                    total={postsData?.metadata.total || 0}
                    page={page}
                    limit={limit}
                    onPageChange={setPage}
                    isLoading={isLoading}
                    showCategoryColumn={showCategoryColumn}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </EducationGuard>
    </AppLayout>
  );
}
