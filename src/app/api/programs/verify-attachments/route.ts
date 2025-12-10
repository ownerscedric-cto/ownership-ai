import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/programs/verify-attachments
 * 첨부파일 URL 마이그레이션 결과 확인
 */
export async function GET() {
  try {
    // 전체 통계
    const { count: total } = await supabaseAdmin
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .eq('dataSource', '기업마당');

    const { count: withAttachment } = await supabaseAdmin
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .eq('dataSource', '기업마당')
      .not('attachmentUrl', 'is', null);

    const withoutAttachment = (total || 0) - (withAttachment || 0);

    // 샘플 데이터 조회 (attachmentUrl이 있는 것 5개)
    const { data: samplesWithAttachment } = await supabaseAdmin
      .from('programs')
      .select('id, title, attachmentUrl, rawData')
      .eq('dataSource', '기업마당')
      .not('attachmentUrl', 'is', null)
      .limit(5);

    // 샘플 데이터 조회 (attachmentUrl이 없는 것 5개)
    const { data: samplesWithoutAttachment } = await supabaseAdmin
      .from('programs')
      .select('id, title, attachmentUrl, rawData')
      .eq('dataSource', '기업마당')
      .is('attachmentUrl', null)
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        statistics: {
          total: total || 0,
          withAttachment: withAttachment || 0,
          withoutAttachment,
        },
        samplesWithAttachment: (samplesWithAttachment || []).map((p: { id: string; title: string; attachmentUrl: string | null; rawData: Record<string, unknown> }) => ({
          id: p.id,
          title: p.title,
          attachmentUrl: p.attachmentUrl,
          rawFlpthNm: p.rawData.flpthNm,
        })),
        samplesWithoutAttachment: (samplesWithoutAttachment || []).map((p: { id: string; title: string; attachmentUrl: string | null; rawData: Record<string, unknown> }) => ({
          id: p.id,
          title: p.title,
          attachmentUrl: p.attachmentUrl,
          rawFlpthNm: p.rawData.flpthNm,
        })),
      },
    });
  } catch (error) {
    console.error('[VerifyAttachments] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VERIFY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to verify attachments',
        },
      },
      { status: 500 }
    );
  }
}
