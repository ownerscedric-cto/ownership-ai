import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

// GET /api/education/resources/[id] - 자료 상세 조회
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 자료 조회
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (resourceError || !resource) {
      return errorResponse(ErrorCode.NOT_FOUND, '자료를 찾을 수 없습니다', null, 404);
    }

    // Supabase 테이블이 이미 camelCase이므로 변환 불필요
    return successResponse(resource);
  } catch (error) {
    console.error('Resource detail error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '자료 조회 중 오류가 발생했습니다', null, 500);
  }
}
