import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { z } from 'zod';

// ============================================
// GET /api/education/knowhow/posts/[id]/comments
// 게시글 댓글 목록 조회
// ============================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();

    // 댓글 조회 (작성일 오름차순)
    const { data: comments, error: commentsError } = await supabase
      .from('knowhow_comments')
      .select('*')
      .eq('postId', postId)
      .order('createdAt', { ascending: true });

    if (commentsError) {
      console.error('댓글 조회 실패:', commentsError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 조회에 실패했습니다', null, 500);
    }

    // camelCase 변환
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      authorName: comment.authorName,
      userId: comment.userId,
      postId: comment.postId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    return successResponse(formattedComments);
  } catch (error) {
    console.error('댓글 조회 에러:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 조회 중 오류가 발생했습니다', null, 500);
  }
}

// ============================================
// POST /api/education/knowhow/posts/[id]/comments
// 댓글 작성
// ============================================

const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요')
    .max(1000, '댓글은 1000자 이내로 작성해주세요'),
  authorName: z.string().min(1, '작성자 이름을 입력해주세요'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();

    // 인증 체크 (선택사항 - 로그인 필수로 변경 가능)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Body 파싱 및 검증
    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // 게시글 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('knowhow_posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return errorResponse(ErrorCode.NOT_FOUND, '게시글을 찾을 수 없습니다', null, 404);
    }

    // UUID 명시적 생성
    const { data: uuidData } = await supabase.rpc('gen_random_uuid');
    const newId = uuidData || crypto.randomUUID();
    const now = new Date().toISOString();

    // 댓글 생성
    const { data: newComment, error: createError } = await supabase
      .from('knowhow_comments')
      .insert({
        id: newId,
        postId: postId,
        content: validatedData.content,
        authorName: validatedData.authorName,
        userId: user?.id || null,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (createError) {
      console.error('댓글 생성 실패:', createError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 작성에 실패했습니다', null, 500);
    }

    // camelCase 변환
    const formattedComment = {
      id: newComment.id,
      content: newComment.content,
      authorName: newComment.authorName,
      userId: newComment.userId,
      postId: newComment.postId,
      createdAt: newComment.createdAt,
      updatedAt: newComment.updatedAt,
    };

    return successResponse(formattedComment, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력값이 올바르지 않습니다',
        error.issues,
        400
      );
    }

    console.error('댓글 작성 에러:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 작성 중 오류가 발생했습니다', null, 500);
  }
}
