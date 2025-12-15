'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  User,
  Clock,
  MessageSquare,
  Loader2,
  Edit2,
  Trash2,
  X,
  Reply,
  CornerDownRight,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * 댓글 기본 인터페이스
 */
export interface BaseComment {
  id: string;
  content: string;
  authorName: string;
  userId: string;
  parentId: string | null; // 대댓글인 경우 부모 댓글 ID
  createdAt: string;
  updatedAt: string;
  replies?: BaseComment[]; // 대댓글 목록 (클라이언트에서 구성)
}

/**
 * 댓글 컴포넌트 Props
 */
interface CommentsProps<T extends BaseComment> {
  // React Query
  commentsQuery: UseQueryResult<{ success: boolean; data: T[] }, Error>;
  createMutation: UseMutationResult<
    unknown,
    Error,
    { content: string; parentId?: string | null },
    unknown
  >;
  updateMutation: UseMutationResult<
    unknown,
    Error,
    { commentId: string; content: string },
    unknown
  >;
  deleteMutation: UseMutationResult<unknown, Error, string, unknown>;
}

/**
 * 공통 댓글 컴포넌트
 * - Video, KnowHow 등 다양한 댓글 시스템에서 재사용 가능
 * - 댓글 목록 표시, 작성, 수정, 삭제 기능 제공
 * - 대댓글(답글) 지원
 * - 작성자만 수정/삭제 가능
 */
export function Comments<T extends BaseComment>({
  commentsQuery,
  createMutation,
  updateMutation,
  deleteMutation,
}: CommentsProps<T>) {
  const [commentContent, setCommentContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null); // 답글 대상 댓글 ID
  const [replyContent, setReplyContent] = useState('');

  // 현재 로그인한 사용자
  const { user } = useAuth();

  const comments: T[] = commentsQuery.data?.data || [];
  const isLoading = commentsQuery.isLoading;

  // 총 댓글 수 계산 (부모 + 대댓글)
  const totalCommentCount = comments.reduce(
    (acc, comment) => acc + 1 + (comment.replies?.length || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentContent.trim()) {
      toast.error('댓글 내용을 입력해주세요');
      return;
    }

    try {
      await createMutation.mutateAsync({
        content: commentContent,
      });

      toast.success('댓글이 작성되었습니다');
      setCommentContent('');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      toast.error('댓글 작성에 실패했습니다');
    }
  };

  // 답글 작성
  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim()) {
      toast.error('답글 내용을 입력해주세요');
      return;
    }

    try {
      await createMutation.mutateAsync({
        content: replyContent,
        parentId,
      });

      toast.success('답글이 작성되었습니다');
      setReplyContent('');
      setReplyingToId(null);
    } catch (error) {
      console.error('답글 작성 실패:', error);
      toast.error('답글 작성에 실패했습니다');
    }
  };

  const handleEdit = (comment: T) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setReplyingToId(null); // 수정 시 답글 폼 닫기
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleUpdateSubmit = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('댓글 내용을 입력해주세요');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        commentId,
        content: editContent,
      });

      toast.success('댓글이 수정되었습니다');
      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      toast.error('댓글 수정에 실패했습니다');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(commentId);
      toast.success('댓글이 삭제되었습니다');
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      toast.error('댓글 삭제에 실패했습니다');
    }
  };

  const handleReplyClick = (commentId: string) => {
    setReplyingToId(replyingToId === commentId ? null : commentId);
    setReplyContent('');
    setEditingCommentId(null); // 답글 시 수정 폼 닫기
  };

  // 댓글 아이템 렌더링 (재사용)
  const renderCommentItem = (comment: T, isReply = false) => (
    <div
      key={comment.id}
      className={`${isReply ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''} ${!isReply ? 'border-b pb-4 last:border-0' : 'pt-3'}`}
    >
      {/* 작성자 및 작성일 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {isReply && <CornerDownRight className="w-3 h-3 text-gray-400" />}
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="font-medium">{comment.authorName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(comment.createdAt)}</span>
          </div>
        </div>

        {/* 수정/삭제/답글 버튼 */}
        <div className="flex items-center gap-1">
          {/* 답글 버튼 (대댓글에는 표시 안함) */}
          {!isReply && user && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleReplyClick(comment.id)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Reply className="w-4 h-4" />
            </Button>
          )}

          {/* 수정/삭제 버튼 (작성자만) */}
          {user && user.id === comment.userId && (
            <>
              {editingCommentId === comment.id ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={updateMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleUpdateSubmit(comment.id)}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      '저장'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(comment)}
                    disabled={deleteMutation.isPending}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-600" />
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* 댓글 내용 */}
      {editingCommentId === comment.id ? (
        <Textarea
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          disabled={updateMutation.isPending}
          rows={3}
          maxLength={1000}
          className="mt-2"
        />
      ) : (
        <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
      )}

      {/* 답글 작성 폼 */}
      {!isReply && replyingToId === comment.id && (
        <div className="mt-3 ml-8 pl-4 border-l-2 border-blue-200 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CornerDownRight className="w-3 h-3" />
            <span>{comment.authorName}님에게 답글 작성</span>
          </div>
          <Textarea
            placeholder="답글을 입력하세요..."
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            disabled={createMutation.isPending}
            rows={2}
            maxLength={1000}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyingToId(null)}
              disabled={createMutation.isPending}
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={() => handleReplySubmit(comment.id)}
              disabled={createMutation.isPending || !replyContent.trim()}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '답글 작성'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 대댓글 목록 */}
      {!isReply && comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => renderCommentItem(reply as T, true))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          댓글 {totalCommentCount}
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
          <div className="space-y-4">{comments.map(comment => renderCommentItem(comment))}</div>
        )}

        {/* 댓글 작성 폼 */}
        <form onSubmit={handleSubmit} className="border-t pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commentContent">댓글</Label>
            <Textarea
              id="commentContent"
              placeholder="댓글을 입력하세요..."
              value={commentContent}
              onChange={e => setCommentContent(e.target.value)}
              disabled={createMutation.isPending}
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={createMutation.isPending || !commentContent.trim()}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  작성 중...
                </>
              ) : (
                '댓글 작성'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
