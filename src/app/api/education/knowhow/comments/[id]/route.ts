import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  updateKnowHowCommentSchema,
  type UpdateKnowHowCommentInput,
} from '@/lib/validations/education';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/education/knowhow/comments/[id] - 노하우 댓글 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. 댓글 조회
    const { data: comment, error: commentError } = await supabase
      .from('knowhow_comments')
      .select('*')
      .eq('id', id)
      .single();

    if (commentError || !comment) {
      return errorResponse(ErrorCode.NOT_FOUND, '댓글을 찾을 수 없습니다', null, 404);
    }

    // camelCase 변환
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      authorName: comment.author_name,
      userId: comment.user_id,
      postId: comment.post_id,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    };

    // 2. 성공 응답
    return successResponse(formattedComment);
  } catch (error) {
    console.error('KnowHow comment detail error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '댓글 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}

// PATCH /api/education/knowhow/comments/[id] - 노하우 댓글 수정 (작성자만)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. 댓글 존재 여부 및 작성자 확인
    const { data: existingComment, error: commentError } = await supabase
      .from('knowhow_comments')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (commentError || !existingComment) {
      return errorResponse(ErrorCode.NOT_FOUND, '댓글을 찾을 수 없습니다', null, 404);
    }

    if (existingComment.user_id !== user.id) {
      return errorResponse(ErrorCode.FORBIDDEN, '댓글 작성자만 수정할 수 있습니다', null, 403);
    }

    // 3. 요청 바디 파싱
    const body = await request.json();

    // 4. 유효성 검증 (Zod)
    const validatedData: UpdateKnowHowCommentInput = updateKnowHowCommentSchema.parse(body);

    // 5. 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from('knowhow_comments')
      .update({ content: validatedData.content })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('댓글 수정 실패:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 수정에 실패했습니다', null, 500);
    }

    // 6. camelCase 변환
    const formattedComment = {
      id: updatedComment.id,
      content: updatedComment.content,
      authorName: updatedComment.author_name,
      userId: updatedComment.user_id,
      postId: updatedComment.post_id,
      createdAt: updatedComment.created_at,
      updatedAt: updatedComment.updated_at,
    };

    // 7. 성공 응답
    return successResponse(formattedComment);
  } catch (error) {
    // Zod 유효성 검증 에러
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력 데이터가 유효하지 않습니다',
        error.issues,
        400
      );
    }

    // 서버 에러
    console.error('KnowHow comment update error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '댓글 수정 중 오류가 발생했습니다',
      null,
      500
    );
  }
}

// DELETE /api/education/knowhow/comments/[id] - 노하우 댓글 삭제 (작성자만)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. 댓글 존재 여부 및 작성자 확인
    const { data: existingComment, error: commentError } = await supabase
      .from('knowhow_comments')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (commentError || !existingComment) {
      return errorResponse(ErrorCode.NOT_FOUND, '댓글을 찾을 수 없습니다', null, 404);
    }

    if (existingComment.user_id !== user.id) {
      return errorResponse(ErrorCode.FORBIDDEN, '댓글 작성자만 삭제할 수 있습니다', null, 403);
    }

    // 3. 댓글 삭제
    const { error: deleteError } = await supabase
      .from('knowhow_comments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('댓글 삭제 실패:', deleteError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 삭제에 실패했습니다', null, 500);
    }

    // 4. 성공 응답 (204 No Content)
    return new Response(null, { status: 204 });
  } catch (error) {
    // 서버 에러
    console.error('KnowHow comment delete error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '댓글 삭제 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
