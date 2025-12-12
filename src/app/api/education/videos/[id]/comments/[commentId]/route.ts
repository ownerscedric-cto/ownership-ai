import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// 댓글 수정 스키마
const updateCommentSchema = z.object({
  content: z.string().min(1, '댓글 내용은 필수입니다').max(1000, '댓글은 1000자 이하여야 합니다'),
});

/**
 * PUT /api/education/videos/[id]/comments/[commentId]
 * 댓글 수정 (작성자만 가능)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: videoId, commentId } = await params;
    const body = await request.json();
    const validated = updateCommentSchema.parse(body);
    const supabase = await createClient();

    // 1. 현재 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 2. 댓글 조회 및 작성자 확인
    const { data: comment, error: fetchError } = await supabase
      .from('video_comments')
      .select('*')
      .eq('id', commentId)
      .eq('videoId', videoId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Comment not found',
          },
        },
        { status: 404 }
      );
    }

    // 3. 작성자 본인 확인
    if (comment.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only edit your own comments',
          },
        },
        { status: 403 }
      );
    }

    // 4. 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from('video_comments')
      .update({
        content: validated.content,
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError || !updatedComment) {
      console.error('댓글 수정 실패:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update comment',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    console.error('PUT /api/education/videos/[id]/comments/[commentId] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update comment',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/education/videos/[id]/comments/[commentId]
 * 댓글 삭제 (작성자만 가능)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: videoId, commentId } = await params;
    const supabase = await createClient();

    // 1. 현재 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 2. 댓글 조회 및 작성자 확인
    const { data: comment, error: fetchError } = await supabase
      .from('video_comments')
      .select('*')
      .eq('id', commentId)
      .eq('videoId', videoId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Comment not found',
          },
        },
        { status: 404 }
      );
    }

    // 3. 작성자 본인 확인
    if (comment.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own comments',
          },
        },
        { status: 403 }
      );
    }

    // 4. 댓글 삭제
    const { error: deleteError } = await supabase
      .from('video_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('댓글 삭제 실패:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DELETE_ERROR',
            message: 'Failed to delete comment',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: commentId },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/education/videos/[id]/comments/[commentId] error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete comment',
        },
      },
      { status: 500 }
    );
  }
}
