import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { incrementKnowHowPostViewCount } from '@/lib/server/view-count';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// PATCH /api/education/knowhow/posts/[id]/view - 노하우 게시글 조회수 증가 (쿠키 기반 중복 방지)
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 게시글 존재 여부 확인
    const { data: post } = await supabase
      .from('knowhow_posts')
      .select('id')
      .eq('id', id)
      .single();

    if (!post) {
      return errorResponse(ErrorCode.NOT_FOUND, '게시글을 찾을 수 없습니다', null, 404);
    }

    // 조회수 증가 (쿠키 기반 중복 방지)
    const result = await incrementKnowHowPostViewCount(id);

    return successResponse(result);
  } catch (error) {
    console.error('KnowHow post view count error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '조회수 증가 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
