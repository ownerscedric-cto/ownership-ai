'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Search, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useKnowHowPosts } from '@/hooks/useEducation';
import { KnowHowPostList } from '@/components/education/KnowHowPostList';
import { AppLayout } from '@/components/layout/AppLayout';

/**
 * 노하우 커뮤니티 메인 페이지
 * - 전체/공지/이벤트 탭
 * - 카테고리 필터링
 * - 검색 기능
 * - 게시글 목록 (KnowHowPostList)
 */
export default function KnowHowCommunityPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'announcement' | 'event'>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // 전체 게시글
  const { data: allPosts, isLoading: allLoading } = useKnowHowPosts({
    search: searchQuery,
    page,
    limit,
  });

  // 공지사항
  const { data: announcements, isLoading: announcementsLoading } = useKnowHowPosts({
    isAnnouncement: true,
    search: searchQuery,
    page,
    limit,
  });

  // 이벤트
  const { data: events, isLoading: eventsLoading } = useKnowHowPosts({
    isEvent: true,
    search: searchQuery,
    page,
    limit,
  });

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
          <Button onClick={() => router.push('/education/knowhow/new')} size="lg">
            <PlusCircle className="w-5 h-5 mr-2" />
            글쓰기
          </Button>
        </div>
      </div>

      {/* Tabs (전체/공지/이벤트) */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="announcement">공지사항</TabsTrigger>
          <TabsTrigger value="event">이벤트</TabsTrigger>
        </TabsList>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4 my-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="제목, 내용 검색..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* TODO: 카테고리 필터 추가 */}
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
