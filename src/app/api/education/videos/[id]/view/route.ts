import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { incrementEducationVideoViewCount } from '@/lib/server/view-count';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// PATCH /api/education/videos/[id]/view - 교육 비디오 조회수 증가 (쿠키 기반 중복 방지)
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 비디오 존재 여부 확인
    const { data: video, error: videoError } = await supabase
      .from('education_videos')
      .select('id')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return errorResponse(ErrorCode.NOT_FOUND, '비디오를 찾을 수 없습니다', null, 404);
    }

    // 조회수 증가 (쿠키 기반 중복 방지)
    const result = await incrementEducationVideoViewCount(id);

    return successResponse(result);
  } catch (error) {
    console.error('Education video view count error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '조회수 증가 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
