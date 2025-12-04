import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/programs/verify-attachments
 * 첨부파일 URL 마이그레이션 결과 확인
 */
export async function GET() {
  try {
    // 전체 통계
    const total = await prisma.program.count({
      where: { dataSource: '기업마당' },
    });

    const withAttachment = await prisma.program.count({
      where: {
        dataSource: '기업마당',
        attachmentUrl: { not: null },
      },
    });

    const withoutAttachment = total - withAttachment;

    // 샘플 데이터 조회 (attachmentUrl이 있는 것 5개)
    const samplesWithAttachment = await prisma.program.findMany({
      where: {
        dataSource: '기업마당',
        attachmentUrl: { not: null },
      },
      select: {
        id: true,
        title: true,
        attachmentUrl: true,
        rawData: true,
      },
      take: 5,
    });

    // 샘플 데이터 조회 (attachmentUrl이 없는 것 5개)
    const samplesWithoutAttachment = await prisma.program.findMany({
      where: {
        dataSource: '기업마당',
        attachmentUrl: null,
      },
      select: {
        id: true,
        title: true,
        attachmentUrl: true,
        rawData: true,
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        statistics: {
          total,
          withAttachment,
          withoutAttachment,
        },
        samplesWithAttachment: samplesWithAttachment.map(p => ({
          id: p.id,
          title: p.title,
          attachmentUrl: p.attachmentUrl,
          rawFlpthNm: (p.rawData as Record<string, unknown>).flpthNm,
        })),
        samplesWithoutAttachment: samplesWithoutAttachment.map(p => ({
          id: p.id,
          title: p.title,
          attachmentUrl: p.attachmentUrl,
          rawFlpthNm: (p.rawData as Record<string, unknown>).flpthNm,
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
