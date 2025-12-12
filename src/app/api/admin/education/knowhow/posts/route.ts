import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createAdminKnowHowPostSchema,
  type CreateAdminKnowHowPostInput,
} from '@/lib/validations/education';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';

// POST /api/admin/education/knowhow/posts - 관리자 게시글 생성 (공지/이벤트)
export async function POST(request: NextRequest) {
  try {
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
    // 현재는 인증된 사용자 모두 접근 가능하도록 설정
    // 추후 user.user_metadata.role === 'admin' 등으로 체크

    // 2. 요청 바디 파싱
    const body = await request.json();
    console.log('Received body:', JSON.stringify(body, null, 2));

    // 3. 유효성 검증 (Zod)
    const validatedData: CreateAdminKnowHowPostInput = createAdminKnowHowPostSchema.parse(body);

    // 4. 카테고리 존재 여부 확인 (categoryId가 있는 경우에만)
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

    // 5. 사용자 이름 가져오기
    const authorName = user.user_metadata?.name || user.email?.split('@')[0] || '관리자';

    // 6. 게시글 데이터 준비 (camelCase - Supabase 테이블 컬럼명과 일치)
    // id, createdAt, updatedAt은 Supabase 기본값 사용
    const postData: Record<string, unknown> = {
      userId: user.id,
      authorName: authorName,
      categoryId: validatedData.categoryId,
      title: validatedData.title,
      content: validatedData.content,
      imageUrls: validatedData.imageUrls || [],
      fileUrls: validatedData.fileUrls || [],
      fileNames: validatedData.fileNames || [],
      isAnnouncement: validatedData.isAnnouncement || false,
      isEvent: validatedData.isEvent || false,
      isPinned: validatedData.isPinned || false,
    };

    if (validatedData.startDate) {
      postData.startDate = new Date(validatedData.startDate).toISOString();
    }
    if (validatedData.endDate) {
      postData.endDate = new Date(validatedData.endDate).toISOString();
    }

    // 7. 게시글 생성
    const { data: post, error: createError } = await supabase
      .from('knowhow_posts')
      .insert(postData)
      .select()
      .single();

    if (createError) {
      console.error('게시글 생성 실패 (Full Error):', JSON.stringify(createError, null, 2));
      console.error('postData:', JSON.stringify(postData, null, 2));
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        '게시글 생성에 실패했습니다',
        createError,
        500
      );
    }

    // 8. 성공 응답
    return successResponse(post, undefined, 201);
  } catch (error) {
    // Zod 유효성 검증 에러
    if (error instanceof ZodError) {
      console.error('Validation error:', JSON.stringify(error.issues, null, 2));
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력 데이터가 유효하지 않습니다',
        error.issues,
        400
      );
    }

    // 서버 에러
    console.error('Admin KnowHow post creation error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '게시글 생성 중 오류가 발생했습니다', null, 500);
  }
}
