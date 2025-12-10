import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  updateAdminKnowHowPostSchema,
  type UpdateAdminKnowHowPostInput,
} from '@/lib/validations/education';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// PATCH /api/admin/education/knowhow/posts/[id] - 관리자 게시글 수정
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // TODO: 관리자 권한 체크 로직 추가 필요

    // 2. 게시글 존재 여부 확인
    const { data: existingPost } = await supabase
      .from('knowhow_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingPost) {
      return errorResponse(ErrorCode.NOT_FOUND, '게시글을 찾을 수 없습니다', null, 404);
    }

    // 3. 요청 바디 파싱
    const body = await request.json();

    // 4. 유효성 검증 (Zod)
    const validatedData: UpdateAdminKnowHowPostInput = updateAdminKnowHowPostSchema.parse(body);

    // 5. 카테고리 변경 시 존재 여부 확인
    if (validatedData.categoryId) {
      const { data: category } = await supabase
        .from('knowhow_categories')
        .select('*')
        .eq('id', validatedData.categoryId)
        .single();

      if (!category) {
        return errorResponse(ErrorCode.NOT_FOUND, '카테고리를 찾을 수 없습니다', null, 404);
      }
    }

    // 6. 업데이트 데이터 준비 (snake_case로 변환)
    const updateData: Record<string, unknown> = {};

    if (validatedData.categoryId !== undefined) {
      updateData.category_id = validatedData.categoryId;
    }
    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }
    if (validatedData.content !== undefined) {
      updateData.content = validatedData.content;
    }
    if (validatedData.imageUrls !== undefined) {
      updateData.image_urls = validatedData.imageUrls;
    }
    if (validatedData.fileUrls !== undefined) {
      updateData.file_urls = validatedData.fileUrls;
    }
    if (validatedData.fileNames !== undefined) {
      updateData.file_names = validatedData.fileNames;
    }
    if (validatedData.isAnnouncement !== undefined) {
      updateData.is_announcement = validatedData.isAnnouncement;
    }
    if (validatedData.isEvent !== undefined) {
      updateData.is_event = validatedData.isEvent;
    }
    if (validatedData.isPinned !== undefined) {
      updateData.is_pinned = validatedData.isPinned;
    }
    if (validatedData.startDate !== undefined) {
      updateData.start_date = validatedData.startDate
        ? new Date(validatedData.startDate).toISOString()
        : null;
    }
    if (validatedData.endDate !== undefined) {
      updateData.end_date = validatedData.endDate
        ? new Date(validatedData.endDate).toISOString()
        : null;
    }

    // 7. 게시글 수정
    const { data: updatedPost, error: updateError } = await supabase
      .from('knowhow_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('게시글 수정 실패:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '게시글 수정에 실패했습니다', null, 500);
    }

    // 8. 성공 응답
    return successResponse(updatedPost);
  } catch (error) {
    // Zod 유효성 검증 에러
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력 데이터가 유효하지 않습니다',
        error.issues,
        400
      );
    }

    // 서버 에러
    console.error('Admin KnowHow post update error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '게시글 수정 중 오류가 발생했습니다', null, 500);
  }
}

// DELETE /api/admin/education/knowhow/posts/[id] - 관리자 게시글 삭제
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // TODO: 관리자 권한 체크 로직 추가 필요

    // 2. 게시글 존재 여부 확인
    const { data: existingPost } = await supabase
      .from('knowhow_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingPost) {
      return errorResponse(ErrorCode.NOT_FOUND, '게시글을 찾을 수 없습니다', null, 404);
    }

    // 3. 게시글 삭제 (댓글도 CASCADE 삭제됨)
    const { error: deleteError } = await supabase.from('knowhow_posts').delete().eq('id', id);

    if (deleteError) {
      console.error('게시글 삭제 실패:', deleteError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '게시글 삭제에 실패했습니다', null, 500);
    }

    // 4. 성공 응답 (204 No Content)
    return new Response(null, { status: 204 });
  } catch (error) {
    // 서버 에러
    console.error('Admin KnowHow post delete error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '게시글 삭제 중 오류가 발생했습니다', null, 500);
  }
}
