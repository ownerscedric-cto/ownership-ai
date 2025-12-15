'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/education/VideoPlayer';
import { VideoComments } from '@/components/education/VideoComments';
import { VideoResources } from '@/components/education/VideoResources';
import { useEducationVideo, useIncrementVideoViewCount } from '@/hooks/useEducation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Clock, ArrowLeft, Tag } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { hasViewedContent, addViewedContentId } from '@/lib/cookies';
import { formatDate } from '@/lib/utils/date';

const VIEWED_VIDEOS_COOKIE = 'viewed_education_videos';

/**
 * 교육 비디오 상세 페이지
 * - VideoPlayer 통합
 * - 조회수 자동 증가 (쿠키 기반 중복 방지)
 * - 비디오 정보 표시
 */
export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params?.id as string;

  // React Query 데이터 조회
  const { data, isLoading, error } = useEducationVideo(videoId);
  const incrementViewCount = useIncrementVideoViewCount();

  // 조회수 증가 추적 (중복 방지)
  const hasIncrementedRef = useRef(false);

  // 조회수 증가 (쿠키 기반 중복 방지 - 24시간)
  useEffect(() => {
    if (videoId && data?.success && !hasIncrementedRef.current) {
      // 쿠키 확인: 이미 조회한 비디오인지 체크
      const alreadyViewed = hasViewedContent(VIEWED_VIDEOS_COOKIE, videoId);

      if (!alreadyViewed) {
        // 조회수 증가 API 호출
        incrementViewCount.mutate(videoId);

        // 쿠키에 추가 (24시간 TTL)
        addViewedContentId(VIEWED_VIDEOS_COOKIE, videoId, 1);
      }

      hasIncrementedRef.current = true;
    }
  }, [videoId, data?.success, incrementViewCount]);

  // 로딩 상태
  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="animate-pulse space-y-6">
            <div className="aspect-video bg-gray-300 rounded-lg" />
            <div className="h-8 bg-gray-300 rounded w-2/3" />
            <div className="h-4 bg-gray-300 rounded w-full" />
            <div className="h-4 bg-gray-300 rounded w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // 에러 상태
  if (error || !data?.success) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-red-600 font-semibold mb-2">
              비디오를 불러오는 중 오류가 발생했습니다
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

  const video = data.data;

  // 재생시간 포맷팅
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* 뒤로가기 버튼 */}
        <Button onClick={() => router.back()} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>

        {/* 비디오 플레이어 */}
        <div className="mb-8">
          <VideoPlayer url={video.videoUrl} thumbnailUrl={video.thumbnailUrl} title={video.title} />
        </div>

        {/* 비디오 정보 */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge variant="secondary">{video.category.name}</Badge>
              {video.duration && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {formatDuration(video.duration)}
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Eye className="w-4 h-4" />
                조회수 {video.viewCount.toLocaleString()}
              </div>
            </div>
            <CardTitle className="text-2xl">{video.title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 설명 */}
            {video.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">설명</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{video.description}</p>
              </div>
            )}

            {/* 태그 */}
            {video.tags && video.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  태그
                </h3>
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 생성일 */}
            <div className="text-sm text-gray-500 pt-4 border-t">
              등록일: {formatDate(video.createdAt)}
            </div>
          </CardContent>
        </Card>

        {/* 관련 자료 다운로드 */}
        <div className="mt-8">
          <VideoResources videoId={videoId} />
        </div>

        {/* 댓글 섹션 */}
        <div className="mt-8">
          <VideoComments videoId={videoId} />
        </div>
      </div>
    </AppLayout>
  );
}
