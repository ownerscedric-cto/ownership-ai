import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/education/resources/[id]/download - 자료 다운로드 (다운로드 카운트 증가)
 *
 * 쿠키 기반 중복 방지 없음 (다운로드는 중복 허용)
 * - 사용자가 동일 파일을 여러 번 다운로드할 수 있음
 * - 실제 다운로드 행위마다 카운트 증가
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 리소스 조회 (camelCase 컬럼명 사용)
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('id, fileUrl, downloadCount')
      .eq('id', id)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Resource not found',
          },
        },
        { status: 404 }
      );
    }

    // 다운로드 카운트 증가 (비동기로 백그라운드에서 처리)
    supabase
      .from('resources')
      .update({ downloadCount: (resource.downloadCount || 0) + 1 })
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to increment download count:', error);
        }
      });

    // 파일 URL로 리다이렉트
    return NextResponse.redirect(resource.fileUrl);
  } catch (error) {
    console.error(`GET /api/education/resources/[id]/download error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to download resource',
        },
      },
      { status: 500 }
    );
  }
}
