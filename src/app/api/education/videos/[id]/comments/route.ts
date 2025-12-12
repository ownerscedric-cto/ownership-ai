import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// 댓글 생성 스키마
const createCommentSchema = z.object({
  content: z.string().min(1, '댓글 내용은 필수입니다').max(1000, '댓글은 1000자 이하여야 합니다'),
});

/**
 * GET /api/education/videos/[id]/comments
 * 특정 비디오의 댓글 목록 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 댓글 조회 (최신순)
    const { data: comments, error } = await supabase
      .from('video_comments')
      .select('*')
      .eq('videoId', id)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('댓글 조회 실패:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch comments',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: comments || [],
    });
  } catch (error) {
    console.error('GET /api/education/videos/[id]/comments error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch comments',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/education/videos/[id]/comments
 * 비디오에 댓글 작성
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = createCommentSchema.parse(body);
    const supabase = await createClient();

    // 1. 현재 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 2. 비디오 존재 확인
    const { data: video, error: videoError } = await supabase
      .from('education_videos')
      .select('id')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Video not found',
          },
        },
        { status: 404 }
      );
    }

    // 3. 사용자 이름 가져오기 (user.user_metadata.name 또는 email)
    const authorName = user.user_metadata?.name || user.email?.split('@')[0] || '익명';

    // 4. 댓글 생성
    const { data: comment, error: createError } = await supabase
      .from('video_comments')
      .insert({
        videoId: id,
        userId: user.id,
        authorName: authorName,
        content: validated.content,
      })
      .select()
      .single();

    if (createError || !comment) {
      console.error('댓글 생성 실패:', createError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREATE_ERROR',
            message: 'Failed to create comment',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/education/videos/[id]/comments error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
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
          message: 'Failed to create comment',
        },
      },
      { status: 500 }
    );
  }
}
