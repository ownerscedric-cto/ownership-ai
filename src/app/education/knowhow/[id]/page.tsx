'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { useKnowHow, useIncrementKnowHowViewCount } from '@/hooks/useEducation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, User, ArrowLeft, Tag } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { hasViewedContent, addViewedContentId } from '@/lib/cookies';
import 'highlight.js/styles/github.css';

const VIEWED_KNOWHOW_COOKIE = 'viewed_knowhow';

/**
 * 노하우 상세 페이지
 * - Markdown 렌더링
 * - 조회수 자동 증가 (쿠키 기반 중복 방지)
 * - 노하우 정보 표시
 */
export default function KnowHowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const knowhowId = params?.id as string;

  // React Query 데이터 조회
  const { data, isLoading, error } = useKnowHow(knowhowId);
  const incrementViewCount = useIncrementKnowHowViewCount();

  // 조회수 증가 추적 (중복 방지)
  const hasIncrementedRef = useRef(false);

  // 조회수 증가 (쿠키 기반 중복 방지 - 24시간)
  useEffect(() => {
    if (knowhowId && data?.success && !hasIncrementedRef.current) {
      // 쿠키 확인: 이미 조회한 노하우인지 체크
      const alreadyViewed = hasViewedContent(VIEWED_KNOWHOW_COOKIE, knowhowId);

      if (!alreadyViewed) {
        // 조회수 증가 API 호출
        incrementViewCount.mutate(knowhowId);

        // 쿠키에 추가 (24시간 TTL)
        addViewedContentId(VIEWED_KNOWHOW_COOKIE, knowhowId, 1);
      }

      hasIncrementedRef.current = true;
    }
  }, [knowhowId, data?.success, incrementViewCount]);

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
              노하우를 불러오는 중 오류가 발생했습니다
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

  const knowhow = data.data;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 뒤로가기 버튼 */}
        <Button onClick={() => router.back()} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>

        {/* 노하우 정보 */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge variant="secondary">{knowhow.category}</Badge>
              {knowhow.author && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  {knowhow.author}
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Eye className="w-4 h-4" />
                조회수 {knowhow.viewCount.toLocaleString()}
              </div>
            </div>
            <CardTitle className="text-2xl">{knowhow.title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Markdown 콘텐츠 */}
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{knowhow.content}</ReactMarkdown>
            </div>

            {/* 태그 */}
            {knowhow.tags && knowhow.tags.length > 0 && (
              <div className="pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  태그
                </h3>
                <div className="flex flex-wrap gap-2">
                  {knowhow.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 생성일 */}
            <div className="text-sm text-gray-500 pt-4 border-t">
              작성일: {new Date(knowhow.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
