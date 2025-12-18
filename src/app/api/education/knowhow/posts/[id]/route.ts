import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateKnowHowPostSchema } from '@/lib/validations/education';
import { z } from 'zod';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. 게시글 조회
    const { data: post, error: fetchError } = await supabase
      .from('knowhow_posts')
      .select(
        `
        *,
        category:knowhow_categories(*)
      `
      )
      .eq('id', id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Post not found',
          },
        },
        { status: 404 }
      );
    }

    // 2. 댓글 수 조회
    const { count: commentsCount } = await supabase
      .from('knowhow_comments')
      .select('*', { count: 'exact', head: true })
      .eq('postId', id);

    // 3. _count 형식으로 변환
    const formattedPost = {
      ...post,
      _count: {
        comments: commentsCount || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: formattedPost,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch post',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateKnowHowPostSchema.parse(body);
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

    // 2. 게시글 조회 (작성자 확인용)
    const { data: existingPost, error: fetchError } = await supabase
      .from('knowhow_posts')
      .select('userId')
      .eq('id', id)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Post not found',
          },
        },
        { status: 404 }
      );
    }

    // 3. 작성자 권한 확인
    if (existingPost.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this post',
          },
        },
        { status: 403 }
      );
    }

    // 4. 게시글 수정
    const { data: post, error: updateError } = await supabase
      .from('knowhow_posts')
      .update({
        title: validated.title,
        content: validated.content,
        categoryId: validated.categoryId,
        imageUrls: validated.imageUrls || [],
        fileUrls: validated.fileUrls || [],
        fileNames: validated.fileNames || [],
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        category:knowhow_categories(*)
      `
      )
      .single();

    if (updateError || !post) {
      console.error('게시글 수정 실패:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update post',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('PUT /api/education/knowhow/posts/[id] error:', error);

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
          message: 'Failed to update post',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 2. 게시글 조회 (작성자 확인용)
    const { data: post, error: fetchError } = await supabase
      .from('knowhow_posts')
      .select('userId')
      .eq('id', id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Post not found',
          },
        },
        { status: 404 }
      );
    }

    // 3. 작성자 권한 확인
    if (post.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this post',
          },
        },
        { status: 403 }
      );
    }

    // 4. 게시글 삭제
    const { error: deleteError } = await supabase.from('knowhow_posts').delete().eq('id', id);

    if (deleteError) {
      console.error('게시글 삭제 실패:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete post',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete post',
        },
      },
      { status: 500 }
    );
  }
}
