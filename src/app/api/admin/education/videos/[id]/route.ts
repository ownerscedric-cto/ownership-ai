import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Request Schema for PATCH
 */
const updateVideoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.string().min(1).optional(),
  videoUrl: z.string().url().optional(),
  videoType: z.enum(['youtube', 'vimeo', 'file']).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * PATCH /api/admin/education/videos/[id] - 비디오 수정 (관리자 전용)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 1. Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    // 2. 비디오 존재 확인
    const existingVideo = await prisma.educationVideo.findUnique({
      where: { id },
    });

    if (!existingVideo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: 'Video not found',
          },
        },
        { status: 404 }
      );
    }

    // 3. Request body validation
    const body = await request.json();
    const validatedData = updateVideoSchema.parse(body);

    // 4. 비디오 업데이트
    const updatedVideo = await prisma.educationVideo.update({
      where: { id },
      data: validatedData,
    });

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      data: updatedVideo,
      message: '비디오가 수정되었습니다.',
    });
  } catch (error) {
    console.error('PATCH /api/admin/education/videos/[id] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid request body',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update video',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/education/videos/[id] - 비디오 삭제 (관리자 전용)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    // 2. 비디오 존재 확인
    const video = await prisma.educationVideo.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: 'Video not found',
          },
        },
        { status: 404 }
      );
    }

    // 3. 비디오 삭제
    await prisma.educationVideo.delete({
      where: { id },
    });

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      message: '비디오가 삭제되었습니다.',
    });
  } catch (error) {
    console.error(`DELETE /api/admin/education/videos/[id] error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete video',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
