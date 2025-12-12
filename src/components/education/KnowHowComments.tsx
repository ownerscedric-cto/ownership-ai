'use client';

import {
  useKnowHowComments,
  useCreateKnowHowComment,
  useUpdateKnowHowComment,
  useDeleteKnowHowComment,
  type KnowHowComment,
} from '@/hooks/useEducation';
import { Comments } from '@/components/common/Comments';

interface KnowHowCommentsProps {
  postId: string;
}

/**
 * 노하우 커뮤니티 댓글 컴포넌트 (Wrapper)
 * - 공통 Comments 컴포넌트를 사용하여 노하우 댓글 기능 제공
 */
export function KnowHowComments({ postId }: KnowHowCommentsProps) {
  const commentsQuery = useKnowHowComments(postId);
  const createMutation = useCreateKnowHowComment(postId);
  const updateMutation = useUpdateKnowHowComment(postId);
  const deleteMutation = useDeleteKnowHowComment(postId);

  return (
    <Comments<KnowHowComment>
      commentsQuery={commentsQuery}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
    />
  );
}
