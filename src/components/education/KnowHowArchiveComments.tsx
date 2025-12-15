'use client';

import {
  useKnowHowArchiveComments,
  useCreateKnowHowArchiveComment,
  useUpdateKnowHowArchiveComment,
  useDeleteKnowHowArchiveComment,
  type KnowHowArchiveComment,
} from '@/hooks/useEducation';
import { Comments } from '@/components/common/Comments';

interface KnowHowArchiveCommentsProps {
  archiveId: string;
}

/**
 * 노하우 아카이브 댓글 컴포넌트 (Wrapper)
 * - 공통 Comments 컴포넌트를 사용하여 아카이브 댓글 기능 제공
 */
export function KnowHowArchiveComments({ archiveId }: KnowHowArchiveCommentsProps) {
  const commentsQuery = useKnowHowArchiveComments(archiveId);
  const createMutation = useCreateKnowHowArchiveComment(archiveId);
  const updateMutation = useUpdateKnowHowArchiveComment(archiveId);
  const deleteMutation = useDeleteKnowHowArchiveComment(archiveId);

  return (
    <Comments<KnowHowArchiveComment>
      commentsQuery={commentsQuery}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
    />
  );
}
