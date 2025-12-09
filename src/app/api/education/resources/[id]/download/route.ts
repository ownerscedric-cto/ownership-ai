import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/education/resources/[id]/download - 자료 다운로드 (다운로드 카운트 증가)
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 다운로드 카운트 증가
    const resource = await prisma.resource.update({
      where: { id: params.id },
      data: {
        downloadCount: { increment: 1 },
      },
    });

    // 파일 URL로 리다이렉트
    return NextResponse.redirect(resource.fileUrl);
  } catch (error) {
    console.error(`GET /api/education/resources/${params.id}/download error:`, error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
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
