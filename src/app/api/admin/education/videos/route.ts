import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();

    // 2. Request body validation
    const body = await request.json();
    const validatedData = createVideoSchema.parse(body);

    // 3. 카테고리 존재 확인 및 이름 가져오기
    const { data: category, error: categoryError } = await supabase
      .from('video_categories')
      .select('name')
      .eq('id', validatedData.categoryId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: '카테고리를 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      );
    }

    // 4. 비디오 생성 (category는 TEXT 필드이므로 카테고리 이름 저장)
    const { data: video, error: createError } = await supabase
      .from('education_videos')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        category: category.name, // 카테고리 이름 저장
        videoUrl: validatedData.videoUrl,
        videoType: validatedData.videoType,
        thumbnailUrl: validatedData.thumbnailUrl,
        duration: validatedData.duration,
        tags: validatedData.tags,
      })
      .select()
      .single();

    if (createError) {
      console.error('비디오 생성 실패:', createError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create video',
            details: createError.message,
          },
        },
        { status: 500 }
      );
    }

    // 5. 성공 응답
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
