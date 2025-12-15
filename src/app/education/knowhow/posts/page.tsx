'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Search, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useKnowHowPosts, useKnowHowCategories } from '@/hooks/useEducation';
import { KnowHowPostList } from '@/components/education/KnowHowPostList';
import { AppLayout } from '@/components/layout/AppLayout';

/**
 * 노하우 커뮤니티 메인 페이지
 * - 전체/공지/이벤트 탭
 * - 카테고리 필터링 (Badge 형식)
 * - 검색 기능
 * - 게시글 목록 (KnowHowPostList)
 */
export default function KnowHowCommunityPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'announcement' | 'event'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 20;

  // 카테고리 목록 조회
  const { data: categoriesData } = useKnowHowCategories();
  const categories = categoriesData?.data || [];

  // 전체 게시글
  const { data: allPosts, isLoading: allLoading } = useKnowHowPosts({
    search: searchQuery,
    categoryId: selectedCategoryId,
    page,
    limit,
  });

  // 공지사항
  const { data: announcements, isLoading: announcementsLoading } = useKnowHowPosts({
    isAnnouncement: true,
    search: searchQuery,
    categoryId: selectedCategoryId,
    page,
    limit,
  });

  // 이벤트
  const { data: events, isLoading: eventsLoading } = useKnowHowPosts({
    isEvent: true,
    search: searchQuery,
    categoryId: selectedCategoryId,
    page,
    limit,
  });

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
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 뒤로가기 버튼 */}
        <Button onClick={() => router.push('/education')} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          교육 센터로
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">노하우 커뮤니티</h1>
            <p className="text-gray-600 mt-1">컨설턴트들의 실전 노하우를 공유하고 소통하세요</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/education/knowhow/archive')}
              variant="outline"
              size="lg"
            >
              큐레이션 노하우
            </Button>
            <Button onClick={() => router.push('/education/knowhow/posts/new')} size="lg">
              <PlusCircle className="w-5 h-5 mr-2" />
              글쓰기
            </Button>
          </div>
        </div>

        {/* Tabs (전체/공지/이벤트) */}
        <Tabs value={selectedTab} onValueChange={v => setSelectedTab(v as typeof selectedTab)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="announcement">공지사항</TabsTrigger>
            <TabsTrigger value="event">이벤트</TabsTrigger>
          </TabsList>

          {/* 검색 및 필터 */}
          <div className="my-6 space-y-4">
            {/* 검색창 */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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

            {/* 카테고리 필터 (Badge 형식) */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategoryId === undefined ? 'default' : 'outline'}
                className={`cursor-pointer ${selectedCategoryId === undefined ? 'bg-[#0052CC]' : ''}`}
                onClick={() => handleCategoryChange(undefined)}
              >
                전체
              </Badge>
              {categories.map(category => (
                <Badge
                  key={category.id}
                  variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                  className={`cursor-pointer ${selectedCategoryId === category.id ? 'bg-[#0052CC]' : ''}`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  {category.name}
                  {category._count && category._count.posts > 0 && (
                    <span className="ml-1 text-xs opacity-70">({category._count.posts})</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* 게시글 목록 - 전체 */}
          <TabsContent value="all" className="mt-6">
            <KnowHowPostList
              posts={allPosts?.data || []}
              total={allPosts?.metadata.total || 0}
              page={page}
              limit={limit}
              onPageChange={setPage}
              isLoading={allLoading}
            />
          </TabsContent>

          {/* 게시글 목록 - 공지사항 */}
          <TabsContent value="announcement" className="mt-6">
            <KnowHowPostList
              posts={announcements?.data || []}
              total={announcements?.metadata.total || 0}
              page={page}
              limit={limit}
              onPageChange={setPage}
              isLoading={announcementsLoading}
            />
          </TabsContent>

          {/* 게시글 목록 - 이벤트 */}
          <TabsContent value="event" className="mt-6">
            <KnowHowPostList
              posts={events?.data || []}
              total={events?.metadata.total || 0}
              page={page}
              limit={limit}
              onPageChange={setPage}
              isLoading={eventsLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
