import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/programs/migrate-attachments
 * 기존 프로그램 데이터의 rawData에서 첨부파일 URL을 추출하여 attachmentUrl 필드 업데이트
 *
 * 기업마당 데이터만 해당 (flpthNm 필드 사용)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    console.log('[POST /api/programs/migrate-attachments] Starting migration...');

    // 기업마당 프로그램 전체 조회 (잘못된 데이터 수정을 위해 전체 업데이트)
    const { data: programs } = await supabaseAdmin
      .from('programs')
      .select('*')
      .eq('dataSource', '기업마당');

    console.log(`[Migrate] Found ${programs?.length || 0} programs to migrate`);

    let updatedCount = 0;
    let skippedCount = 0;

    // 각 프로그램의 rawData에서 flpthNm 추출
    for (const program of programs || []) {
      const rawData = program.rawData as Record<string, unknown>;
      const flpthNm = rawData.flpthNm;

      if (flpthNm && typeof flpthNm === 'string') {
        // 여러 개의 첨부파일이 @ 구분자로 연결된 경우 첫 번째만 사용
        const firstFile = flpthNm.split('@')[0].trim();

        if (!firstFile) {
          console.log(`[Migrate] ⏭️ Skipped: ${program.title} (Empty flpthNm after split)`);
          skippedCount++;
          continue;
        }

        // 이미 프로토콜이 있으면 그대로 사용, 없으면 base URL 추가
        let attachmentUrl: string;
        if (firstFile.startsWith('http://') || firstFile.startsWith('https://')) {
          attachmentUrl = firstFile;
        } else {
          attachmentUrl = `https://www.bizinfo.go.kr${firstFile}`;
        }

        // attachmentUrl 업데이트
        await supabaseAdmin
          .from('programs')
          .update({ attachmentUrl })
          .eq('id', program.id);

        console.log(`[Migrate] ✅ Updated: ${program.title} → ${attachmentUrl}`);
        updatedCount++;
      } else {
        console.log(`[Migrate] ⏭️ Skipped: ${program.title} (No flpthNm)`);
        skippedCount++;
      }
    }

    console.log(
      `[Migrate] ✅ Migration complete: ${updatedCount} updated, ${skippedCount} skipped`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          total: programs?.length || 0,
          updated: updatedCount,
          skipped: skippedCount,
        },
        metadata: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Migrate] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MIGRATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to migrate attachments',
          details: error instanceof Error ? error.stack : null,
        },
      },
      { status: 500 }
    );
  }
}
