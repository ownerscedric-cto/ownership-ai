import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/education/knowhow/archive/[id] - 아카이브 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. 아카이브 조회 (knowhow 테이블)
    const { data: archive, error: archiveError } = await supabase
      .from('knowhow')
      .select(
        `
        *,
        category:knowhow_categories(*)
      `
      )
      .eq('id', id)
      .single();

    if (archiveError || !archive) {
      return errorResponse(ErrorCode.NOT_FOUND, '아카이브를 찾을 수 없습니다', null, 404);
    }

    // 2. camelCase 변환
    const formattedArchive = {
      id: archive.id,
      title: archive.title,
      content: archive.content,
      category: archive.category
        ? {
            id: archive.category.id,
            name: archive.category.name,
            description: archive.category.description,
          }
        : null,
      viewCount: archive.viewCount,
      createdAt: archive.createdAt,
      updatedAt: archive.updatedAt,
    };

    // 3. 성공 응답
    return successResponse(formattedArchive);
  } catch (error) {
    console.error('KnowHow archive detail error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '아카이브 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}

// PATCH /api/education/knowhow/archive/[id] - 아카이브 조회수 증가
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. 아카이브 존재 여부 확인
    const { data: existingArchive, error: fetchError } = await supabase
      .from('knowhow')
      .select('id, viewCount')
      .eq('id', id)
      .single();

    if (fetchError || !existingArchive) {
      return errorResponse(ErrorCode.NOT_FOUND, '아카이브를 찾을 수 없습니다', null, 404);
    }

    // 2. 조회수 증가
    const { data: updatedArchive, error: updateError } = await supabase
      .from('knowhow')
      .update({ viewCount: existingArchive.viewCount + 1 })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('아카이브 조회수 증가 실패:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '조회수 증가에 실패했습니다', null, 500);
    }

    // 3. 성공 응답
    return successResponse({ viewCount: updatedArchive.viewCount });
  } catch (error) {
    console.error('KnowHow archive view count error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '조회수 증가 중 오류가 발생했습니다', null, 500);
  }
}
