import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { z } from 'zod';

// ============================================
// GET /api/education/knowhow/archive/[id]/comments
// 아카이브 댓글 목록 조회 (대댓글 중첩 구조)
// ============================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: archiveId } = await params;
    const supabase = await createClient();

    // 댓글 조회 (작성일 오름차순)
    const { data: comments, error: commentsError } = await supabase
      .from('knowhow_archive_comments')
      .select('*')
      .eq('archiveId', archiveId)
      .order('createdAt', { ascending: true });

    if (commentsError) {
      console.error('아카이브 댓글 조회 실패:', commentsError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 조회에 실패했습니다', null, 500);
    }

    // 대댓글을 부모 댓글에 중첩 구조로 변환
    const rootComments = (comments || []).filter(c => !c.parentId);
    const replies = (comments || []).filter(c => c.parentId);

    // 각 부모 댓글에 대댓글 추가
    const commentsWithReplies = rootComments.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parentId === comment.id),
    }));

    return successResponse(commentsWithReplies);
  } catch (error) {
    console.error('아카이브 댓글 조회 에러:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 조회 중 오류가 발생했습니다', null, 500);
  }
}

// ============================================
// POST /api/education/knowhow/archive/[id]/comments
// 아카이브 댓글 작성 (대댓글 지원)
// ============================================

const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요')
    .max(1000, '댓글은 1000자 이내로 작성해주세요'),
  parentId: z.string().nullable().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: archiveId } = await params;
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
    const validatedData = createCommentSchema.parse(body);

    // 아카이브 존재 여부 확인
    const { data: archive, error: archiveError } = await supabase
      .from('knowhow')
      .select('id')
      .eq('id', archiveId)
      .single();

    if (archiveError || !archive) {
      return errorResponse(ErrorCode.NOT_FOUND, '아카이브를 찾을 수 없습니다', null, 404);
    }

    // 사용자 이름 가져오기
    const authorName = user.user_metadata?.name || user.email?.split('@')[0] || '익명';

    // 대댓글인 경우 부모 댓글 존재 여부 확인
    if (validatedData.parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('knowhow_archive_comments')
        .select('id')
        .eq('id', validatedData.parentId)
        .eq('archiveId', archiveId)
        .single();

      if (parentError || !parentComment) {
        return errorResponse(ErrorCode.NOT_FOUND, '부모 댓글을 찾을 수 없습니다', null, 404);
      }
    }

    // 댓글 생성
    const { data: newComment, error: createError } = await supabase
      .from('knowhow_archive_comments')
      .insert({
        archiveId: archiveId,
        content: validatedData.content,
        authorName: authorName,
        userId: user.id,
        parentId: validatedData.parentId || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('아카이브 댓글 생성 실패:', createError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 작성에 실패했습니다', null, 500);
    }

    return successResponse(newComment, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력값이 올바르지 않습니다',
        error.issues,
        400
      );
    }

    console.error('아카이브 댓글 작성 에러:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '댓글 작성 중 오류가 발생했습니다', null, 500);
  }
}
