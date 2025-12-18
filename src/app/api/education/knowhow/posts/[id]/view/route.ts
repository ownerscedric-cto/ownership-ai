import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// PATCH /api/education/knowhow/posts/[id]/view - 노하우 게시글 조회수 증가
// 클라이언트에서 쿠키 기반 중복 방지를 처리하므로 서버에서는 단순히 증가만 수행
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. 게시글 존재 여부 및 현재 조회수 확인
    const { data: post, error: postError } = await supabase
      .from('knowhow_posts')
      .select('id, viewCount')
      .eq('id', id)
      .single();

    if (postError || !post) {
      return errorResponse(ErrorCode.NOT_FOUND, '게시글을 찾을 수 없습니다', null, 404);
    }

    // 2. 조회수 증가
    const { data: updatedPost, error: updateError } = await supabase
      .from('knowhow_posts')
      .update({ viewCount: post.viewCount + 1 })
      .eq('id', id)
      .select('viewCount')
      .single();

    if (updateError) {
      console.error('게시글 조회수 증가 실패:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '조회수 증가에 실패했습니다', null, 500);
    }

    return successResponse({ viewCount: updatedPost.viewCount });
  } catch (error) {
    console.error('KnowHow post view count error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '조회수 증가 중 오류가 발생했습니다', null, 500);
  }
}
