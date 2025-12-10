'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useKnowHowPost, useIncrementKnowHowPostViewCount, useKnowHowComments, useCreateKnowHowComment } from '@/hooks/useEducation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, User, Calendar, ArrowLeft, MessageSquare, Pin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { KnowHowComments } from '@/components/education/KnowHowComments';
import { hasViewedContent, addViewedContentId } from '@/lib/cookies';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const VIEWED_KNOWHOW_POSTS_COOKIE = 'viewed_knowhow_posts';

/**
 * 노하우 커뮤니티 게시글 상세 페이지
 * - 게시글 내용 표시
 * - 조회수 자동 증가 (쿠키 기반 중복 방지)
 * - 댓글 목록 및 작성
 * - 공지/이벤트/고정글 표시
 */
export default function KnowHowPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;

  // React Query 데이터 조회
  const { data, isLoading, error } = useKnowHowPost(postId);
  const incrementViewCount = useIncrementKnowHowPostViewCount();

  // 댓글 조회
  const { data: commentsData, isLoading: isLoadingComments } = useKnowHowComments(postId);
  const createComment = useCreateKnowHowComment();

  // 조회수 증가 추적 (중복 방지)
  const hasIncrementedRef = useRef(false);

  // 조회수 증가 (쿠키 기반 중복 방지 - 24시간)
  useEffect(() => {
    if (postId && data?.success && !hasIncrementedRef.current) {
      // 쿠키 확인: 이미 조회한 게시글인지 체크
      const alreadyViewed = hasViewedContent(VIEWED_KNOWHOW_POSTS_COOKIE, postId);

      if (!alreadyViewed) {
        // 조회수 증가 API 호출
        incrementViewCount.mutate(postId);

        // 쿠키에 추가 (24시간 TTL)
        addViewedContentId(VIEWED_KNOWHOW_POSTS_COOKIE, postId, 1);
      }

      hasIncrementedRef.current = true;
    }
  }, [postId, data?.success, incrementViewCount]);

  // 댓글 작성 핸들러
  const handleAddComment = async (content: string) => {
    // 임시 작성자 이름 (나중에 사용자 정보로 대체)
    const authorName = '익명';

    await createComment.mutateAsync({
      postId,
      content,
      authorName,
    });
  };

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
              게시글을 불러오는 중 오류가 발생했습니다
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

  const post = data.data;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 뒤로가기 버튼 */}
        <Button onClick={() => router.push('/education/knowhow')} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>

        {/* 게시글 정보 */}
        <Card className="mb-8">
          <CardHeader>
            {/* 배지 및 메타 정보 */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {post.isPinned && (
                <div className="flex items-center gap-1 text-[#0052CC]">
                  <Pin className="w-4 h-4" fill="#0052CC" />
                  <span className="text-xs font-medium">고정됨</span>
                </div>
              )}
              {post.isAnnouncement && (
                <Badge variant="destructive" className="text-xs">
                  공지
                </Badge>
              )}
              {post.isEvent && (
                <Badge variant="default" className="text-xs bg-green-600">
                  이벤트
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {post.category.name}
              </Badge>
            </div>

            {/* 제목 */}
            <CardTitle className="text-2xl mb-4">{post.title}</CardTitle>

            {/* 작성자, 작성일, 조회수, 댓글수 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{post.authorName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>조회수 {post.viewCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>댓글 {post._count.comments.toLocaleString()}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 게시글 내용 */}
            <div className="prose prose-gray max-w-none whitespace-pre-wrap">{post.content}</div>
          </CardContent>
        </Card>

        {/* 댓글 섹션 */}
        <KnowHowComments
          postId={postId}
          comments={commentsData?.data || []}
          isLoading={isLoadingComments}
          onAddComment={handleAddComment}
        />
      </div>
    </AppLayout>
  );
}
