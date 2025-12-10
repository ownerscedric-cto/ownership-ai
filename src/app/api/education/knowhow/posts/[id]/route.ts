import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  updateKnowHowPostSchema,
  type UpdateKnowHowPostInput,
} from '@/lib/validations/education';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/education/knowhow/posts/[id] - 노하우 게시글 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. 게시글 조회
    const { data: post, error: postError } = await supabase
      .from('knowhow_posts')
      .select(`
        *,
        category:knowhow_categories(*),
        comments:knowhow_comments(*)
      `)
      .eq('id', id)
      .single();

    if (postError || !post) {
      return errorResponse(ErrorCode.NOT_FOUND, '게시글을 찾을 수 없습니다', null, 404);
    }

    // 댓글 카운트
    const { count: commentsCount } = await supabase
      .from('knowhow_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);

    // camelCase 변환
    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      authorName: post.author_name,
      userId: post.user_id,
      categoryId: post.category_id,
      viewCount: post.view_count,
      isPinned: post.is_pinned,
      isAnnouncement: post.is_announcement,
      isEvent: post.is_event,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      category: post.category ? {
        id: post.category.id,
        name: post.category.name,
        description: post.category.description,
      } : null,
      comments: (post.comments || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          authorName: comment.author_name,
          userId: comment.user_id,
          postId: comment.post_id,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
        })),
      _count: {
        comments: commentsCount || 0,
      },
    };

    // 2. 성공 응답
    return successResponse(formattedPost);
  } catch (error) {
    console.error('KnowHow post detail error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '게시글 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}

// PATCH /api/education/knowhow/posts/[id] - 노하우 게시글 수정 (작성자만)
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

    // 2. 게시글 존재 여부 및 작성자 확인
    const { data: existingPost, error: postError } = await supabase
      .from('knowhow_posts')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (postError || !existingPost) {
      return errorResponse(ErrorCode.NOT_FOUND, '게시글을 찾을 수 없습니다', null, 404);
    }

    if (existingPost.user_id !== user.id) {
      return errorResponse(
        ErrorCode.FORBIDDEN,
        '게시글 작성자만 수정할 수 있습니다',
        null,
        403
      );
    }

    // 3. 요청 바디 파싱
    const body = await request.json();

    // 4. 유효성 검증 (Zod)
    const validatedData: UpdateKnowHowPostInput = updateKnowHowPostSchema.parse(body);

    // 5. 카테고리 변경 시 존재 여부 확인
    if (validatedData.categoryId) {
      const { data: category, error: categoryError } = await supabase
        .from('knowhow_categories')
        .select('id')
        .eq('id', validatedData.categoryId)
        .single();

      if (categoryError || !category) {
        return errorResponse(ErrorCode.NOT_FOUND, '카테고리를 찾을 수 없습니다', null, 404);
      }
    }

    // snake_case 변환
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (validatedData.categoryId !== undefined) updateData.category_id = validatedData.categoryId;

    // 6. 게시글 수정
    const { data: updatedPost, error: updateError } = await supabase
      .from('knowhow_posts')
      .update(updateData)
      .eq('id', id)
      .select('*, category:knowhow_categories(*)')
      .single();

    if (updateError) {
      console.error('게시글 수정 실패:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '게시글 수정에 실패했습니다', null, 500);
    }

    // camelCase 변환
    const formattedPost = {
      id: updatedPost.id,
      title: updatedPost.title,
      content: updatedPost.content,
      authorName: updatedPost.author_name,
      userId: updatedPost.user_id,
      categoryId: updatedPost.category_id,
      viewCount: updatedPost.view_count,
      isPinned: updatedPost.is_pinned,
      isAnnouncement: updatedPost.is_announcement,
      isEvent: updatedPost.is_event,
      createdAt: updatedPost.created_at,
      updatedAt: updatedPost.updated_at,
      category: updatedPost.category ? {
        id: updatedPost.category.id,
        name: updatedPost.category.name,
        description: updatedPost.category.description,
      } : null,
    };

    // 7. 성공 응답
    return successResponse(formattedPost);
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
    console.error('KnowHow post update error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '게시글 수정 중 오류가 발생했습니다',
      null,
      500
    );
  }
}

// DELETE /api/education/knowhow/posts/[id] - 노하우 게시글 삭제 (작성자만)
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

    // 2. 게시글 존재 여부 및 작성자 확인
    const { data: existingPost, error: postError } = await supabase
      .from('knowhow_posts')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (postError || !existingPost) {
      return errorResponse(ErrorCode.NOT_FOUND, '게시글을 찾을 수 없습니다', null, 404);
    }

    if (existingPost.user_id !== user.id) {
      return errorResponse(
        ErrorCode.FORBIDDEN,
        '게시글 작성자만 삭제할 수 있습니다',
        null,
        403
      );
    }

    // 3. 게시글 삭제 (댓글도 CASCADE 삭제됨)
    const { error: deleteError } = await supabase
      .from('knowhow_posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('게시글 삭제 실패:', deleteError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '게시글 삭제에 실패했습니다', null, 500);
    }

    // 4. 성공 응답 (204 No Content)
    return new Response(null, { status: 204 });
  } catch (error) {
    // 서버 에러
    console.error('KnowHow post delete error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '게시글 삭제 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
