import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { z } from 'zod';

// ============================================
// PATCH /api/education/knowhow/archive/[id]/comments/[commentId]
// 아카이브 댓글 수정
// ============================================

const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요')
    .max(1000, '댓글은 1000자 이내로 작성해주세요'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: archiveId, commentId } = await params;
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '로그인이 필요합니다', null, 401);
    }

    // Body 파싱 및 검증
    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // 댓글 존재 여부 및 권한 확인
    const { data: existingComment, error: fetchError } = await supabase
      .from('knowhow_archive_comments')
      .select('*')
      .eq('id', commentId)
      .eq('archiveId', archiveId)
      .single();

    if (fetchError || !existingComment) {
      return errorResponse(ErrorCode.NOT_FOUND, '댓글을 찾을 수 없습니다', null, 404);
    }

    // 작성자 확인
    if (existingComment.userId !== user.id) {
      return errorResponse(ErrorCode.FORBIDDEN, '수정 권한이 없습니다', null, 403);
    }

    // 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from('knowhow_archive_comments')
      .update({
        content: validatedData.content,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('아카이브 댓글 수정 실패:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 수정에 실패했습니다', null, 500);
    }

    return successResponse(updatedComment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력값이 올바르지 않습니다',
        error.issues,
        400
      );
    }

    console.error('아카이브 댓글 수정 에러:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 수정 중 오류가 발생했습니다', null, 500);
  }
}

// ============================================
// DELETE /api/education/knowhow/archive/[id]/comments/[commentId]
// 아카이브 댓글 삭제
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: archiveId, commentId } = await params;
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '로그인이 필요합니다', null, 401);
    }

    // 댓글 존재 여부 및 권한 확인
    const { data: existingComment, error: fetchError } = await supabase
      .from('knowhow_archive_comments')
      .select('*')
      .eq('id', commentId)
      .eq('archiveId', archiveId)
      .single();

    if (fetchError || !existingComment) {
      return errorResponse(ErrorCode.NOT_FOUND, '댓글을 찾을 수 없습니다', null, 404);
    }

    // 작성자 확인
    if (existingComment.userId !== user.id) {
      return errorResponse(ErrorCode.FORBIDDEN, '삭제 권한이 없습니다', null, 403);
    }

    // 댓글 삭제 (대댓글도 CASCADE 삭제됨)
    const { error: deleteError } = await supabase
      .from('knowhow_archive_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('아카이브 댓글 삭제 실패:', deleteError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 삭제에 실패했습니다', null, 500);
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('아카이브 댓글 삭제 에러:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 삭제 중 오류가 발생했습니다', null, 500);
  }
}
