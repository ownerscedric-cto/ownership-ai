import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Request Schema
 */
const createVideoSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  categoryId: z.string().min(1, { message: '카테고리를 선택해주세요' }),
  videoUrl: z.string().url(),
  videoType: z.enum(['youtube', 'vimeo', 'file']).default('youtube'),
  thumbnailUrl: z.string().url().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string()).default([]),
});

/**
 * POST /api/admin/education/videos - 비디오 생성 (관리자 전용)
 */
export async function POST(request: NextRequest) {
  // 1. Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    // 2. Request body validation
    const body = await request.json();
    const validatedData = createVideoSchema.parse(body);

    // 3. 비디오 생성
    const video = await prisma.educationVideo.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        categoryId: validatedData.categoryId,
        videoUrl: validatedData.videoUrl,
        videoType: validatedData.videoType,
        thumbnailUrl: validatedData.thumbnailUrl || null,
        duration: validatedData.duration || null,
        tags: validatedData.tags,
      },
    });

    // 4. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: video,
        message: '비디오가 추가되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/education/videos error:', error);

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
          message: 'Failed to create video',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
