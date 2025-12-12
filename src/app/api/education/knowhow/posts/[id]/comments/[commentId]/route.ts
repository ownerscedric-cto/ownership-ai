import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { z } from 'zod';

// 댓글 수정 스키마
const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요')
    .max(1000, '댓글은 1000자 이내로 작성해주세요'),
});

/**
 * PUT /api/education/knowhow/posts/[id]/comments/[commentId]
 * 댓글 수정 (작성자만 가능)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: postId, commentId } = await params;
    const supabase = await createClient();

    // 1. 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '로그인이 필요합니다', null, 401);
    }

    // 2. Body 파싱 및 검증
    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // 3. 댓글 조회 및 작성자 확인
    const { data: comment, error: fetchError } = await supabase
      .from('knowhow_comments')
      .select('*')
      .eq('id', commentId)
      .eq('postId', postId)
      .single();

    if (fetchError || !comment) {
      return errorResponse(ErrorCode.NOT_FOUND, '댓글을 찾을 수 없습니다', null, 404);
    }

    // 4. 작성자 본인 확인
    if (comment.userId !== user.id) {
      return errorResponse(ErrorCode.FORBIDDEN, '본인의 댓글만 수정할 수 있습니다', null, 403);
    }

    // 5. 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from('knowhow_comments')
      .update({
        content: validatedData.content,
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError || !updatedComment) {
      console.error('댓글 수정 실패:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 수정에 실패했습니다', null, 500);
    }

    // camelCase 변환
    const formattedComment = {
      id: updatedComment.id,
      content: updatedComment.content,
      authorName: updatedComment.authorName,
      userId: updatedComment.userId,
      postId: updatedComment.postId,
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
    };

    return successResponse(formattedComment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력값이 올바르지 않습니다',
        error.issues,
        400
      );
    }

    console.error('댓글 수정 에러:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 수정 중 오류가 발생했습니다', null, 500);
  }
}

/**
 * DELETE /api/education/knowhow/posts/[id]/comments/[commentId]
 * 댓글 삭제 (작성자만 가능)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: postId, commentId } = await params;
    const supabase = await createClient();

    // 1. 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '로그인이 필요합니다', null, 401);
    }

    // 2. 댓글 조회 및 작성자 확인
    const { data: comment, error: fetchError } = await supabase
      .from('knowhow_comments')
      .select('*')
      .eq('id', commentId)
      .eq('postId', postId)
      .single();

    if (fetchError || !comment) {
      return errorResponse(ErrorCode.NOT_FOUND, '댓글을 찾을 수 없습니다', null, 404);
    }

    // 3. 작성자 본인 확인
    if (comment.userId !== user.id) {
      return errorResponse(ErrorCode.FORBIDDEN, '본인의 댓글만 삭제할 수 있습니다', null, 403);
    }

    // 4. 댓글 삭제
    const { error: deleteError } = await supabase
      .from('knowhow_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('댓글 삭제 실패:', deleteError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 삭제에 실패했습니다', null, 500);
    }

    return successResponse({ id: commentId });
  } catch (error) {
    console.error('댓글 삭제 에러:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 삭제 중 오류가 발생했습니다', null, 500);
  }
}
