import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

// GET /api/education/videos/[id] - 교육 비디오 상세 조회
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 비디오 조회 (category 객체 join)
    const { data: video, error: videoError } = await supabase
      .from('education_videos')
      .select(`
        *,
        category:video_categories!education_videos_categoryId_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return errorResponse(ErrorCode.NOT_FOUND, '비디오를 찾을 수 없습니다', null, 404);
    }

    // Supabase 테이블이 이미 camelCase이므로 변환 불필요
    return successResponse(video);
  } catch (error) {
    console.error('Education video detail error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '교육 비디오 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
