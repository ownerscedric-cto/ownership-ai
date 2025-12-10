'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User, Clock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { KnowHowComment } from '@/hooks/useEducation';

interface KnowHowCommentsProps {
  postId: string;
  comments: KnowHowComment[];
  isLoading?: boolean;
  onAddComment?: (content: string) => Promise<void>;
}

/**
 * 노하우 커뮤니티 댓글 컴포넌트
 * - 댓글 목록 표시
 * - 댓글 작성 폼
 * - 작성자, 작성일 표시
 */
export function KnowHowComments({ comments, isLoading, onAddComment }: KnowHowCommentsProps) {
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    if (!onAddComment) return;

    try {
      setIsSubmitting(true);
      await onAddComment(commentContent);
      setCommentContent(''); // 입력창 초기화
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          댓글 {comments.length}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 댓글 목록 */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-12 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">첫 번째 댓글을 작성해보세요!</p>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="border-b pb-4 last:border-0">
                {/* 작성자 및 작성일 */}
                <div className="flex items-center gap-3 mb-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="font-medium">{comment.authorName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                </div>

                {/* 댓글 내용 */}
                <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* 댓글 작성 폼 */}
        <form onSubmit={handleSubmit} className="border-t pt-6">
          <Textarea
            placeholder="댓글을 입력하세요..."
            value={commentContent}
            onChange={e => setCommentContent(e.target.value)}
            disabled={isSubmitting}
            rows={3}
            className="mb-3"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !commentContent.trim()}>
              {isSubmitting ? '작성 중...' : '댓글 작성'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
