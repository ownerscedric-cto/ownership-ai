import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

// GET /api/education/videos/[id] - 교육 비디오 상세 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 비디오 조회
    const video = await prisma.educationVideo.findUnique({
      where: { id },
    });

    if (!video) {
      return errorResponse(ErrorCode.NOT_FOUND, '비디오를 찾을 수 없습니다', null, 404);
    }

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

// PATCH /api/education/videos/[id] - 조회수 증가
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 조회수 증가
    const video = await prisma.educationVideo.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return successResponse(video);
  } catch (error) {
    console.error('Education video view count error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '조회수 업데이트 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
