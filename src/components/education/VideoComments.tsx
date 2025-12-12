'use client';

import {
  useVideoComments,
  useCreateVideoComment,
  useUpdateVideoComment,
  useDeleteVideoComment,
  type VideoComment,
} from '@/hooks/useEducation';
import { Comments } from '@/components/common/Comments';

interface VideoCommentsProps {
  videoId: string;
}

/**
 * 교육 비디오 댓글 컴포넌트 (Wrapper)
 * - 공통 Comments 컴포넌트를 사용하여 비디오 댓글 기능 제공
 */
export function VideoComments({ videoId }: VideoCommentsProps) {
  const commentsQuery = useVideoComments(videoId);
  const createMutation = useCreateVideoComment(videoId);
  const updateMutation = useUpdateVideoComment(videoId);
  const deleteMutation = useDeleteVideoComment(videoId);

  return (
    <Comments<VideoComment>
      commentsQuery={commentsQuery}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
    />
  );
}
