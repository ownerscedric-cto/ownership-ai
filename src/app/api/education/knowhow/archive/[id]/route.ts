import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { createKnowHowSchema } from '@/lib/validations/education';
import { z } from 'zod';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/education/knowhow/archive/[id] - 아카이브 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. 아카이브 조회 (knowhow 테이블)
    const { data: archive, error: archiveError } = await supabase
      .from('knowhow')
      .select(
        `
        *,
        category:knowhow_categories(*)
      `
      )
      .eq('id', id)
      .single();

    if (archiveError || !archive) {
      return errorResponse(ErrorCode.NOT_FOUND, '아카이브를 찾을 수 없습니다', null, 404);
    }

    // 2. camelCase 변환
    const formattedArchive = {
      id: archive.id,
      title: archive.title,
      content: archive.content,
      category: archive.category
        ? {
            id: archive.category.id,
            name: archive.category.name,
            description: archive.category.description,
          }
        : null,
      viewCount: archive.viewCount,
      createdAt: archive.createdAt,
      updatedAt: archive.updatedAt,
    };

    // 3. 성공 응답
    return successResponse(formattedArchive);
  } catch (error) {
    console.error('KnowHow archive detail error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '아카이브 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}

// PUT /api/education/knowhow/archive/[id] - 아카이브 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = createKnowHowSchema.parse(body);
    const supabase = await createClient();

    // 1. 카테고리명 조회 (categoryId가 있는 경우)
    let categoryName = '';
    if (validated.categoryId) {
      const { data: categoryData } = await supabase
        .from('knowhow_categories')
        .select('name')
        .eq('id', validated.categoryId)
        .single();
      categoryName = categoryData?.name || '';
    }

    // 2. 아카이브 업데이트
    const { data: knowhow, error: updateError } = await supabase
      .from('knowhow')
      .update({
        title: validated.title,
        content: validated.content,
        category: categoryName || '일반',
        categoryId: validated.categoryId,
        author: validated.author,
        tags: validated.tags || [],
        imageUrls: validated.imageUrls || [],
        fileUrls: validated.fileUrls || [],
        fileNames: validated.fileNames || [],
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        category:knowhow_categories!knowhow_categoryid_fkey(*)
      `
      )
      .single();

    if (updateError || !knowhow) {
      console.error('아카이브 수정 실패:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '아카이브 수정에 실패했습니다', null, 500);
    }

    return successResponse(knowhow);
  } catch (error) {
    console.error('PUT /api/education/knowhow/archive/[id] error:', error);

    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력값이 올바르지 않습니다',
        error.issues,
        400
      );
    }

    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '아카이브 수정 중 오류가 발생했습니다',
      null,
      500
    );
  }
}

// DELETE /api/education/knowhow/archive/[id] - 아카이브 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { error: deleteError } = await supabase.from('knowhow').delete().eq('id', id);

    if (deleteError) {
      console.error('아카이브 삭제 실패:', deleteError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '아카이브 삭제에 실패했습니다', null, 500);
    }

    return successResponse({ id });
  } catch (error) {
    console.error('DELETE /api/education/knowhow/archive/[id] error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '아카이브 삭제 중 오류가 발생했습니다',
      null,
      500
    );
  }
}

// PATCH /api/education/knowhow/archive/[id] - 아카이브 조회수 증가
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. 아카이브 존재 여부 확인
    const { data: existingArchive, error: fetchError } = await supabase
      .from('knowhow')
      .select('id, viewCount')
      .eq('id', id)
      .single();

    if (fetchError || !existingArchive) {
      return errorResponse(ErrorCode.NOT_FOUND, '아카이브를 찾을 수 없습니다', null, 404);
    }

    // 2. 조회수 증가
    const { data: updatedArchive, error: updateError } = await supabase
      .from('knowhow')
      .update({ viewCount: existingArchive.viewCount + 1 })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('아카이브 조회수 증가 실패:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '조회수 증가에 실패했습니다', null, 500);
    }

    // 3. 성공 응답
    return successResponse({ viewCount: updatedArchive.viewCount });
  } catch (error) {
    console.error('KnowHow archive view count error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '조회수 증가 중 오류가 발생했습니다', null, 500);
  }
}
