import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

// GET /api/education/knowhow/[id] - 노하우 상세 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 노하우 조회 (category 객체 join)
    const { data: knowhow, error: knowhowError } = await supabase
      .from('knowhow')
      .select(
        `
        *,
        category:knowhow_categories!knowhow_categoryid_fkey(*)
      `
      )
      .eq('id', id)
      .single();

    if (knowhowError || !knowhow) {
      return errorResponse(ErrorCode.NOT_FOUND, '노하우를 찾을 수 없습니다', null, 404);
    }

    // Supabase 테이블이 이미 camelCase이므로 변환 불필요
    return successResponse(knowhow);
  } catch (error) {
    console.error('KnowHow detail error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '노하우 조회 중 오류가 발생했습니다', null, 500);
  }
}

// PATCH /api/education/knowhow/[id] - 조회수 증가
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 현재 조회수 가져오기 (Supabase 테이블은 camelCase)
    const { data: currentKnowHow } = await supabase
      .from('knowhow')
      .select('viewCount')
      .eq('id', id)
      .single();

    // 조회수 증가
    const { data: knowhow, error: updateError } = await supabase
      .from('knowhow')
      .update({ viewCount: (currentKnowHow?.viewCount ?? 0) + 1 })
      .eq('id', id)
      .select(
        `
        *,
        category:knowhow_categories!knowhow_categoryid_fkey(*)
      `
      )
      .single();

    if (updateError) {
      console.error('조회수 업데이트 실패:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '조회수 업데이트에 실패했습니다', null, 500);
    }

    // Supabase 테이블이 이미 camelCase이므로 변환 불필요
    return successResponse(knowhow);
  } catch (error) {
    console.error('KnowHow view count error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '조회수 업데이트 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
