'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useKnowHow, useIncrementKnowHowViewCount } from '@/hooks/useEducation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Calendar, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { hasViewedContent, addViewedContentId } from '@/lib/cookies';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const VIEWED_KNOWHOW_COOKIE = 'viewed_knowhow';

/**
 * 노하우 아카이브 상세 페이지
 * - 기관에서 작성한 전문 콘텐츠 표시
 * - 조회수 자동 증가 (쿠키 기반 중복 방지)
 * - 댓글 기능 없음 (아카이브는 읽기 전용)
 */
export default function KnowHowArchiveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const archiveId = params?.id as string;

  // React Query 데이터 조회
  const { data, isLoading, error } = useKnowHow(archiveId);
  const incrementViewCount = useIncrementKnowHowViewCount();

  // 조회수 증가 추적 (중복 방지)
  const hasIncrementedRef = useRef(false);

  // 조회수 증가 (쿠키 기반 중복 방지 - 24시간)
  useEffect(() => {
    if (archiveId && data?.success && !hasIncrementedRef.current) {
      // 쿠키 확인: 이미 조회한 아카이브인지 체크
      const alreadyViewed = hasViewedContent(VIEWED_KNOWHOW_COOKIE, archiveId);

      if (!alreadyViewed) {
        // 조회수 증가 API 호출
        incrementViewCount.mutate(archiveId);

        // 쿠키에 추가 (24시간 TTL)
        addViewedContentId(VIEWED_KNOWHOW_COOKIE, archiveId, 1);
      }

      hasIncrementedRef.current = true;
    }
  }, [archiveId, data?.success, incrementViewCount]);

  // 로딩 상태
  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-2/3" />
            <div className="h-4 bg-gray-300 rounded w-full" />
            <div className="h-4 bg-gray-300 rounded w-full" />
            <div className="h-4 bg-gray-300 rounded w-3/4" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // 에러 상태
  if (error || !data?.success) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-red-600 font-semibold mb-2">
              아카이브를 불러오는 중 오류가 발생했습니다
            </p>
            <p className="text-gray-600 text-sm mb-4">{error?.message || '알 수 없는 오류'}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const archive = data.data;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 뒤로가기 버튼 */}
        <Button
          onClick={() => router.push('/education/knowhow/archive')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>

        {/* 아카이브 정보 */}
        <Card className="mb-8">
          <CardHeader>
            {/* 카테고리 배지 */}
            {archive.category && (
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge variant="secondary" className="text-xs">
                  {archive.category.name}
                </Badge>
              </div>
            )}

            {/* 제목 */}
            <CardTitle className="text-2xl mb-4">{archive.title}</CardTitle>

            {/* 작성일, 조회수 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDistanceToNow(new Date(archive.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>조회수 {archive.viewCount.toLocaleString()}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 아카이브 내용 */}
            <div
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: archive.content }}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
