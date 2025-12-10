import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();

    // 2. 비디오 존재 확인
    const { data: existingVideo } = await supabase
      .from('education_videos')
      .select('*')
      .eq('id', id)
      .single();

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

    // 4. 업데이트 데이터 준비
    const updateData: Record<string, unknown> = {};

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.categoryId) {
      // 카테고리 ID가 제공된 경우 카테고리 이름으로 변환
      const { data: category } = await supabase
        .from('video_categories')
        .select('name')
        .eq('id', validatedData.categoryId)
        .single();

      if (!category) {
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

      updateData.category = category.name;
    }
    if (validatedData.videoUrl !== undefined) {
      updateData.videoUrl = validatedData.videoUrl;
    }
    if (validatedData.videoType !== undefined) {
      updateData.videoType = validatedData.videoType;
    }
    if (validatedData.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = validatedData.thumbnailUrl;
    }
    if (validatedData.duration !== undefined) {
      updateData.duration = validatedData.duration;
    }
    if (validatedData.tags !== undefined) {
      updateData.tags = validatedData.tags;
    }

    // 5. 비디오 업데이트
    const { data: updatedVideo, error: updateError } = await supabase
      .from('education_videos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('비디오 수정 실패:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update video',
            details: updateError.message,
          },
        },
        { status: 500 }
      );
    }

    // 6. 성공 응답
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Admin 권한 체크
  const authResult = await requireAdmin(_request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const supabase = await createClient();

    // 2. 비디오 존재 확인
    const { data: video } = await supabase
      .from('education_videos')
      .select('*')
      .eq('id', id)
      .single();

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
    const { error: deleteError } = await supabase.from('education_videos').delete().eq('id', id);

    if (deleteError) {
      console.error('비디오 삭제 실패:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete video',
            details: deleteError.message,
          },
        },
        { status: 500 }
      );
    }

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
