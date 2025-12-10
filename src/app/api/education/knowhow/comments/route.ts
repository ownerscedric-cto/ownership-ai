import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createKnowHowCommentSchema,
  type CreateKnowHowCommentInput,
} from '@/lib/validations/education';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';

// POST /api/education/knowhow/comments - 노하우 댓글 생성
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. 요청 바디 파싱
    const body = await request.json();

    // 3. 유효성 검증 (Zod)
    const validatedData: CreateKnowHowCommentInput = createKnowHowCommentSchema.parse(body);

    // 4. 게시글 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('knowhow_posts')
      .select('id')
      .eq('id', validatedData.postId)
      .single();

    if (postError || !post) {
      return errorResponse(ErrorCode.NOT_FOUND, '게시글을 찾을 수 없습니다', null, 404);
    }

    // 5. 사용자 이름 가져오기
    const authorName = user.user_metadata?.name || user.email?.split('@')[0] || '익명';

    // 6. 댓글 생성
    const { data: comment, error: createError } = await supabase
      .from('knowhow_comments')
      .insert({
        content: validatedData.content,
        post_id: validatedData.postId,
        userId: user.id,
        authorName: authorName,
      })
      .select('*')
      .single();

    if (createError) {
      console.error('댓글 생성 실패:', createError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 생성에 실패했습니다', null, 500);
    }

    // 7. camelCase 변환
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      authorName: comment.authorName,
      userId: comment.userId,
      postId: comment.post_id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    // 8. 성공 응답
    return successResponse(formattedComment, undefined, 201);
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
    console.error('KnowHow comment creation error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 생성 중 오류가 발생했습니다', null, 500);
  }
}

// GET /api/education/knowhow/comments?postId=xxx - 특정 게시글의 댓글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return errorResponse(ErrorCode.VALIDATION_ERROR, '게시글 ID는 필수입니다', null, 400);
    }

    const supabase = await createClient();

    // 1. 게시글 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('knowhow_posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return errorResponse(ErrorCode.NOT_FOUND, '게시글을 찾을 수 없습니다', null, 404);
    }

    // 2. 댓글 목록 조회
    const { data: comments, error: commentsError } = await supabase
      .from('knowhow_comments')
      .select('*')
      .eq('post_id', postId)
      .order('createdAt', { ascending: false });

    if (commentsError) {
      console.error('댓글 목록 조회 실패:', commentsError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 목록 조회에 실패했습니다', null, 500);
    }

    // 3. camelCase 변환
    const formattedComments = (comments || []).map(comment => ({
      id: comment.id,
      content: comment.content,
      authorName: comment.authorName,
      userId: comment.userId,
      postId: comment.post_id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    // 4. 성공 응답
    return successResponse(formattedComments, {
      total: formattedComments.length,
    });
  } catch (error) {
    console.error('KnowHow comment list error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '댓글 목록 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
